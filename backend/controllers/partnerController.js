const Partner = require('../models/Partner');
const Product = require('../models/Product');
const Order = require('../models/Order');
const PartnerPayout = require('../models/PartnerPayout');
const User = require('../models/User');
const crypto = require('crypto');
const { sendEmail } = require('../services/emailService');

exports.getPartners = async (req, res) => {
  try {
    const partners = await Partner.find({ isActive: true })
      .select('shopName slug logo description design.primaryColor address.city');
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getPartnerBySlug = async (req, res) => {
  try {
    const partner = await Partner.findOne({ slug: req.params.slug, isActive: true })
      .select('-bankInfo');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getPartnerProducts = async (req, res) => {
  try {
    const partner = await Partner.findOne({ slug: req.params.slug, isActive: true });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Boutique introuvable' });
    }
    const products = await Product.find({ partner: partner._id, isActive: true })
      .populate('category', 'name slug');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyPartner = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateMyPartner = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const allowed = ['shopName', 'logo', 'description', 'design', 'address', 'phone', 'email', 'socialLinks'];
    allowed.forEach(field => {
      if (req.body[field] !== undefined) {
        partner[field] = req.body[field];
      }
    });

    await partner.save();
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyDashboard = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const orders = await Order.find({
      'orderItems.partner': partner._id,
      $or: [{ isPaid: true }, { status: { $in: ['processing', 'shipped', 'delivered'] } }]
    }).sort({ createdAt: -1 });

    let totalGross = 0;
    let totalCommission = 0;
    let itemsSold = 0;

    orders.forEach(order => {
      order.orderItems.forEach(item => {
        if (item.partner && item.partner.toString() === partner._id.toString()) {
          const itemTotal = item.price * item.qty;
          totalGross += itemTotal;
          totalCommission += itemTotal * (partner.commission / 100);
          itemsSold += item.qty;
        }
      });
    });

    const totalNet = totalGross - totalCommission;
    const avgBasket = orders.length > 0 ? totalGross / orders.length : 0;

    const recentOrders = orders.slice(0, 5).map(order => ({
      _id: order._id,
      orderNumber: order.getFormattedOrderNumber(),
      status: order.status,
      createdAt: order.createdAt,
      items: order.orderItems.filter(i => i.partner && i.partner.toString() === partner._id.toString())
    }));

    const productsCount = await Product.countDocuments({ partner: partner._id, isActive: true });

    const payouts = await PartnerPayout.find({ partner: partner._id })
      .sort({ createdAt: -1 }).limit(3);

    const pendingAmount = await PartnerPayout.aggregate([
      { $match: { partner: partner._id, status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$netAmount' } } }
    ]);

    res.json({
      success: true,
      dashboard: {
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalCommission: parseFloat(totalCommission.toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2)),
        pendingPayout: pendingAmount[0]?.total || 0,
        ordersCount: orders.length,
        itemsSold,
        avgBasket: parseFloat(avgBasket.toFixed(2)),
        productsCount,
        recentOrders,
        recentPayouts: payouts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyOrders = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const status = req.query.status;

    const query = { 'orderItems.partner': partner._id, $or: [{ isPaid: true }, { status: { $in: ['processing', 'shipped', 'delivered'] } }] };
    if (status) query.status = status;

    const total = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    const mapped = orders.map(order => ({
      _id: order._id,
      orderNumber: order.getFormattedOrderNumber(),
      status: order.status,
      createdAt: order.createdAt,
      shippingAddress: order.shippingAddress,
      items: order.orderItems.filter(i => i.partner && i.partner.toString() === partner._id.toString()),
      totalPartner: order.orderItems
        .filter(i => i.partner && i.partner.toString() === partner._id.toString())
        .reduce((acc, i) => acc + i.price * i.qty, 0)
    }));

    res.json({ success: true, orders: mapped, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyOrderDetail = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const order = await Order.findById(req.params.id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Commande introuvable' });
    }

    const partnerItems = order.orderItems.filter(
      i => i.partner && i.partner.toString() === partner._id.toString()
    );
    if (partnerItems.length === 0) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    res.json({
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.getFormattedOrderNumber(),
        status: order.status,
        createdAt: order.createdAt,
        shippingAddress: order.shippingAddress,
        items: partnerItems,
        totalPartner: partnerItems.reduce((acc, i) => acc + i.price * i.qty, 0)
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyStats = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const orders = await Order.find({
      'orderItems.partner': partner._id,
      $or: [{ isPaid: true }, { status: { $in: ['processing', 'shipped', 'delivered'] } }]
    });

    const monthlyStats = {};
    let totalGross = 0;
    let totalItems = 0;
    const productSales = {};

    orders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7);

      order.orderItems.forEach(item => {
        if (item.partner && item.partner.toString() === partner._id.toString()) {
          const itemTotal = item.price * item.qty;
          totalGross += itemTotal;
          totalItems += item.qty;

          if (!monthlyStats[month]) monthlyStats[month] = { revenue: 0, orders: 0, items: 0 };
          monthlyStats[month].revenue += itemTotal;
          monthlyStats[month].items += item.qty;

          const pid = item.product.toString();
          if (!productSales[pid]) productSales[pid] = { name: item.name, qty: 0, revenue: 0 };
          productSales[pid].qty += item.qty;
          productSales[pid].revenue += itemTotal;
        }
      });

      const month2 = order.createdAt.toISOString().slice(0, 7);
      if (monthlyStats[month2]) monthlyStats[month2].orders += 1;
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    const totalNet = totalGross * (1 - partner.commission / 100);

    res.json({
      success: true,
      stats: {
        totalGross: parseFloat(totalGross.toFixed(2)),
        totalCommission: parseFloat((totalGross * partner.commission / 100).toFixed(2)),
        totalNet: parseFloat(totalNet.toFixed(2)),
        totalOrders: orders.length,
        totalItems,
        avgBasket: orders.length > 0 ? parseFloat((totalGross / orders.length).toFixed(2)) : 0,
        commissionRate: partner.commission,
        monthly: monthlyStats,
        topProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyProducts = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const products = await Product.find({ partner: partner._id })
      .populate('category', 'name slug');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.updateMyProductStock = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const product = await Product.findOne({ _id: req.params.productId, partner: partner._id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    if (req.body.stock !== undefined) product.stock = req.body.stock;
    if (req.body.variants) {
      req.body.variants.forEach(v => {
        const variant = product.variants.find(
          pv => pv.size === v.size && pv.color === v.color
        );
        if (variant) variant.stock = v.stock;
      });
    }

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.getMyPayouts = async (req, res) => {
  try {
    const partner = await Partner.findOne({ user: req.user._id });
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Aucune boutique associée' });
    }

    const payouts = await PartnerPayout.find({ partner: partner._id })
      .sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGetPartners = async (req, res) => {
  try {
    const partners = await Partner.find()
      .populate('user', 'firstName lastName email')
      .sort({ createdAt: -1 });
    res.json({ success: true, partners });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGetPartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id)
      .populate('user', 'firstName lastName email');
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }
    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminCreatePartner = async (req, res) => {
  try {
    const { firstName, lastName, email, shopName, commission, phone, address, description } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'Cet email est déjà utilisé' });
    }

    const tempPassword = crypto.randomBytes(8).toString('hex');

    const user = await User.create({
      firstName,
      lastName,
      email,
      password: tempPassword,
      role: 'partner',
      isActive: true
    });

    const partner = await Partner.create({
      user: user._id,
      shopName,
      commission: commission || 20,
      phone: phone || '',
      address: address || {},
      description: description || '',
      email
    });

    try {
      await sendEmail({
        to: email,
        subject: 'VEYRON — Votre espace partenaire est prêt',
        html: `
          <h2>Bienvenue ${firstName},</h2>
          <p>Votre espace partenaire <strong>${shopName}</strong> a été créé.</p>
          <p>Vos identifiants de connexion :</p>
          <ul>
            <li>Email : <strong>${email}</strong></li>
            <li>Mot de passe temporaire : <strong>${tempPassword}</strong></li>
          </ul>
          <p>Veuillez changer votre mot de passe dès votre première connexion.</p>
          <p>— L'équipe VEYRON</p>
        `
      });
    } catch (emailErr) {
      console.error('Erreur envoi email partenaire:', emailErr);
    }

    res.status(201).json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

exports.adminUpdatePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    const fields = ['shopName', 'logo', 'description', 'design', 'address', 'phone', 'email',
      'socialLinks', 'commission', 'bankInfo', 'isActive'];
    fields.forEach(field => {
      if (req.body[field] !== undefined) {
        partner[field] = req.body[field];
      }
    });

    await partner.save();

    const userUpdate = {};
    if (req.body.isActive === false) userUpdate.isActive = false;
    else if (req.body.isActive === true) userUpdate.isActive = true;
    if (req.body.email) userUpdate.email = req.body.email;

    if (Object.keys(userUpdate).length > 0) {
      await User.findByIdAndUpdate(partner.user, userUpdate);
    }

    res.json({ success: true, partner });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminResetPartnerPassword = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    const newPassword = crypto.randomBytes(8).toString('hex');
    const user = await User.findById(partner.user);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Utilisateur introuvable' });
    }

    user.password = newPassword;
    await user.save();

    res.json({ success: true, temporaryPassword: newPassword });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminDeletePartner = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    partner.isActive = false;
    await partner.save();
    await User.findByIdAndUpdate(partner.user, { isActive: false });

    res.json({ success: true, message: 'Partenaire désactivé' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGetPartnerStats = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    const orders = await Order.find({
      'orderItems.partner': partner._id,
      $or: [{ isPaid: true }, { status: { $in: ['processing', 'shipped', 'delivered'] } }]
    });

    let totalGross = 0;
    let totalItems = 0;
    const monthlyStats = {};
    const productSales = {};

    orders.forEach(order => {
      const month = order.createdAt.toISOString().slice(0, 7);
      order.orderItems.forEach(item => {
        if (item.partner && item.partner.toString() === partner._id.toString()) {
          const itemTotal = item.price * item.qty;
          totalGross += itemTotal;
          totalItems += item.qty;

          if (!monthlyStats[month]) monthlyStats[month] = { revenue: 0, orders: 0, items: 0 };
          monthlyStats[month].revenue += itemTotal;
          monthlyStats[month].items += item.qty;

          const pid = item.product.toString();
          if (!productSales[pid]) productSales[pid] = { name: item.name, qty: 0, revenue: 0 };
          productSales[pid].qty += item.qty;
          productSales[pid].revenue += itemTotal;
        }
      });
      const m = order.createdAt.toISOString().slice(0, 7);
      if (monthlyStats[m]) monthlyStats[m].orders += 1;
    });

    const topProducts = Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    const commissionTotal = totalGross * (partner.commission / 100);

    res.json({
      success: true,
      stats: {
        totalGross: parseFloat(totalGross.toFixed(2)),
        commissionRate: partner.commission,
        totalCommission: parseFloat(commissionTotal.toFixed(2)),
        totalNet: parseFloat((totalGross - commissionTotal).toFixed(2)),
        totalOrders: orders.length,
        totalItems,
        avgBasket: orders.length > 0 ? parseFloat((totalGross / orders.length).toFixed(2)) : 0,
        monthly: monthlyStats,
        topProducts
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGetPartnerProducts = async (req, res) => {
  try {
    const products = await Product.find({ partner: req.params.id })
      .populate('category', 'name slug');
    res.json({ success: true, products });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminCreatePartnerProduct = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    req.body.partner = partner._id;
    if (!req.body.brand) req.body.brand = partner.shopName;

    const product = await Product.create(req.body);
    res.status(201).json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

exports.adminUpdatePartnerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, partner: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    Object.keys(req.body).forEach(key => {
      product[key] = req.body[key];
    });

    await product.save();
    res.json({ success: true, product });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminDeletePartnerProduct = async (req, res) => {
  try {
    const product = await Product.findOne({ _id: req.params.productId, partner: req.params.id });
    if (!product) {
      return res.status(404).json({ success: false, message: 'Produit introuvable' });
    }

    product.isActive = false;
    await product.save();
    res.json({ success: true, message: 'Produit désactivé' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGeneratePayout = async (req, res) => {
  try {
    const partner = await Partner.findById(req.params.id);
    if (!partner) {
      return res.status(404).json({ success: false, message: 'Partenaire introuvable' });
    }

    const { period } = req.body;
    if (!period) {
      return res.status(400).json({ success: false, message: 'Période requise (ex: 2026-03)' });
    }

    const existing = await PartnerPayout.findOne({ partner: partner._id, period });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Reversement déjà généré pour cette période' });
    }

    const startDate = new Date(`${period}-01`);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

    const orders = await Order.find({
      'orderItems.partner': partner._id,
      isPaid: true,
      status: 'delivered',
      createdAt: { $gte: startDate, $lt: endDate }
    });

    let grossAmount = 0;
    const orderIds = [];

    orders.forEach(order => {
      let hasPartnerItems = false;
      order.orderItems.forEach(item => {
        if (item.partner && item.partner.toString() === partner._id.toString()) {
          grossAmount += item.price * item.qty;
          hasPartnerItems = true;
        }
      });
      if (hasPartnerItems) orderIds.push(order._id);
    });

    const commissionAmount = grossAmount * (partner.commission / 100);
    const netAmount = grossAmount - commissionAmount;

    const payout = await PartnerPayout.create({
      partner: partner._id,
      period,
      grossAmount: parseFloat(grossAmount.toFixed(2)),
      commissionRate: partner.commission,
      commissionAmount: parseFloat(commissionAmount.toFixed(2)),
      netAmount: parseFloat(netAmount.toFixed(2)),
      ordersCount: orderIds.length,
      orderIds
    });

    res.status(201).json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur', error: err.message });
  }
};

exports.adminMarkPayoutPaid = async (req, res) => {
  try {
    const payout = await PartnerPayout.findById(req.params.payoutId);
    if (!payout) {
      return res.status(404).json({ success: false, message: 'Reversement introuvable' });
    }

    payout.status = 'paid';
    payout.paidAt = new Date();
    payout.reference = req.body.reference || '';
    payout.notes = req.body.notes || '';
    await payout.save();

    res.json({ success: true, payout });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

exports.adminGetPayouts = async (req, res) => {
  try {
    const query = {};
    if (req.params.id) query.partner = req.params.id;

    const payouts = await PartnerPayout.find(query)
      .populate('partner', 'shopName slug')
      .sort({ createdAt: -1 });
    res.json({ success: true, payouts });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erreur serveur' });
  }
};

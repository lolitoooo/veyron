const User = require('../../models/User');
const { register, login } = require('../../controllers/authController');

jest.mock('../../services/emailService', () => ({
  sendEmail: jest.fn().mockResolvedValue({
    messageId: 'test-message-id',
    accepted: ['test@example.com']
  })
}));

describe('Auth Controller - Unit Tests', () => {
  describe('register', () => {
    it('devrait créer un nouvel utilisateur avec des données valides', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john.doe@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String)
        })
      );

      const user = await User.findOne({ email: 'john.doe@example.com' });
      expect(user).toBeTruthy();
      expect(user.firstName).toBe('John');
      expect(user.lastName).toBe('Doe');
    });

    it('devrait rejeter un email invalide', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'invalid-email',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('email')
        })
      );
    });

    it('devrait rejeter un mot de passe trop court', async () => {
      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          password: '123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('6 caractères')
        })
      );
    });

    it('devrait rejeter un email déjà utilisé', async () => {
      await User.create({
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane@example.com',
        password: 'password123'
      });

      const req = {
        body: {
          firstName: 'John',
          lastName: 'Doe',
          email: 'jane@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('déjà utilisé')
        })
      );
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      await User.create({
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        password: 'password123'
      });
    });

    it('devrait connecter un utilisateur avec des identifiants valides', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          token: expect.any(String)
        })
      );
    });

    it('devrait rejeter un email inexistant', async () => {
      const req = {
        body: {
          email: 'nonexistent@example.com',
          password: 'password123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Identifiants invalides'
        })
      );
    });

    it('devrait rejeter un mot de passe incorrect', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'wrongpassword'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: 'Identifiants invalides'
        })
      );
    });
  });
});

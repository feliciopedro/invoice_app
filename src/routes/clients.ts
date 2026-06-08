import { Router } from 'express';
import { ClientController } from '@/controllers/clientController';
import { requireAuth } from '@/middleware/auth';
import { 
  validateRequest, 
  createClientSchema, 
  updateClientSchema, 
  paramIdSchema,
  clientQuerySchema
} from '@/middleware/validation';

const router = Router();

// Protect all client routes
router.use(requireAuth);

/**
 * @route   GET /api/clients
 * @desc    List all clients for logged-in user
 * @access  Private
 */
router.get(
  '/',
  validateRequest({ query: clientQuerySchema }),
  ClientController.getClients
);

/**
 * @route   POST /api/clients
 * @desc    Create a client
 * @access  Private
 */
router.post(
  '/',
  validateRequest({ body: createClientSchema }),
  ClientController.createClient
);

/**
 * @route   GET /api/clients/:id
 * @desc    Get a single client
 * @access  Private
 */
router.get(
  '/:id',
  validateRequest({ params: paramIdSchema }),
  ClientController.getClientById
);

/**
 * @route   PATCH /api/clients/:id
 * @desc    Update a client
 * @access  Private
 */
router.patch(
  '/:id',
  validateRequest({ params: paramIdSchema, body: updateClientSchema }),
  ClientController.updateClient
);

/**
 * @route   DELETE /api/clients/:id
 * @desc    Delete a client
 * @access  Private
 */
router.delete(
  '/:id',
  validateRequest({ params: paramIdSchema }),
  ClientController.deleteClient
);

export default router;
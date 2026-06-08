import { Request, Response, NextFunction } from 'express';
import prisma from '@/config/database';
import { 
  AuthenticatedRequest, 
  ApiResponse, 
  CreateClientData,
  UpdateClientData,
  NotFoundError,
  AuthorizationError,
} from '@/types';

export class ClientController {
  /**
   * Get all clients for the logged-in user
   * GET /api/clients
   */
  static async getClients(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const { search } = req.query;

      const where: any = {
        userId,
      };

      if (search && typeof search === 'string') {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ];
      }

      const clients = await prisma.client.findMany({
        where,
        orderBy: {
          name: 'asc',
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Clients retrieved successfully',
        data: clients,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get a single client
   * GET /api/clients/:id
   */
  static async getClientById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const client = await prisma.client.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!client) {
        throw new NotFoundError('Client not found');
      }

      const response: ApiResponse = {
        success: true,
        message: 'Client retrieved successfully',
        data: client,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create a client
   * POST /api/clients
   */
  static async createClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const clientData: CreateClientData = req.body;

      const client = await prisma.client.create({
        data: {
          userId,
          name: clientData.name,
          email: clientData.email.toLowerCase(),
          phone: clientData.phone,
          address: clientData.address,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Client created successfully',
        data: client,
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update a client
   * PATCH /api/clients/:id
   */
  static async updateClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const existingClient = await prisma.client.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingClient) {
        throw new NotFoundError('Client not found');
      }

      const updateData: UpdateClientData = req.body;

      const client = await prisma.client.update({
        where: { id },
        data: {
          name: updateData.name ?? existingClient.name,
          email: updateData.email ? updateData.email.toLowerCase() : existingClient.email,
          phone: updateData.phone !== undefined ? updateData.phone : existingClient.phone,
          address: updateData.address !== undefined ? updateData.address : existingClient.address,
        },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Client updated successfully',
        data: client,
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete a client
   * DELETE /api/clients/:id
   */
  static async deleteClient(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      if (!userId) {
        throw new AuthorizationError('User not authenticated');
      }

      const existingClient = await prisma.client.findFirst({
        where: {
          id,
          userId,
        },
      });

      if (!existingClient) {
        throw new NotFoundError('Client not found');
      }

      await prisma.client.delete({
        where: { id },
      });

      const response: ApiResponse = {
        success: true,
        message: 'Client deleted successfully',
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
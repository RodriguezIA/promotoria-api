import express, { Router, Request, Response } from "express";

import { User } from "./user";
import { Client } from "./client";
import { Store } from "./store";
import { Question } from "./question";
import { IStore } from "@/core/interfaces/store";
import { NotificationService } from "@/services/notification.service";

import { authMiddleware } from "../core/middleware/auth.middleware";

const superAdminRouter: Router = express.Router();
const getUserModel = () => new User();
const getClientModel = () => new Client();
const getStoreModel = () => new Store();
const getQuestionModel = () => new Question();

superAdminRouter.post(
  "/register-user",
  async (req: Request, res: Response): Promise<void> => {
    let userModel: User | null = null;
    try {
      const { email, password, name, lastname } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email y password son requeridos" });
        return;
      }
      userModel = getUserModel();
      const result = await userModel.createSuperAdmin(
        email,
        password,
        name,
        lastname,
      );
      res.status(201).json({
        message: "Super admin creado correctamente",
        data: result,
      });
    } catch (error: any) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error creando super admin", details: error });
    } finally {
      userModel = null;
    }
  },
);

superAdminRouter.post(
  "/login",
  async (req: Request, res: Response): Promise<void> => {
    let userModel: User | null = null;
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        res.status(400).json({ error: "Email y password son requeridos" });
        return;
      }
      userModel = getUserModel();
      const result = await userModel.loginSuperAdmin(email, password);
      res.status(201).json({
        message: "Super admin inicio session correctamente",
        data: result,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error creando super admin", details: error });
    } finally {
      userModel = null;
    }
  },
);


superAdminRouter.post("/create-client", async (req: Request, res: Response): Promise<void> => {
  let clientModel: Client | null = null;
  try {
    const { id_user, name, rfc, email, phone, address, city, state, zip, adiccional_notes, id_pais, id_estado, id_ciudad, street, ext_number, int_number, zip_code, neighborhood, address_references } = req.body;

    if (!id_user || !name) {
      res.status(400).json({ error: "Es necesario iniciar session y el nombre para crear un cliente" });
      return;
    }

    clientModel = getClientModel();

    const vc_initialism = name.split(' ').map((word: string) => word.charAt(0).toUpperCase()).join('');

    const result = await clientModel.createClient(id_user, name, {
      rfc,
      email,
      phone,
      address,
      city,
      state,
      zip,
      vc_initialism,
      adiccional_notes,
      address_details: {
        id_pais,
        id_estado,
        id_ciudad,
        street,
        ext_number,
        int_number,
        zip_code,
        neighborhood,
        address_references,
      }
    });

    res.status(201).json({
      message: "Super admin creo cliente correctamente",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error creando cliente", details: error });
  } finally {
    clientModel = null;
  }
  },
);


superAdminRouter.delete("/client/:id_client", authMiddleware, async (req: Request, res: Response) => {
  let clientModel: Client | null = null;
  try {
    const { id_client } = req.params;
    const id_user = req.user?.id;

    console.log("id_user desde req.user:", id_user);

    if (!id_client) {
      res.status(400).json({
        ok: false,
        error: "id_client es requerido",
        message: "el cliente es requerido para eliminarlo",
      });
      return;
    }
    
    if (!id_user) {
      res.status(401).json({ ok: false, message: "Usuario no autenticado" });
      return;
    }

    clientModel = getClientModel();
    const response = await clientModel.deleteClient(Number(id_client), id_user);

    console.log("respuesta de funcion deleteClient:", response);

    res.status(200).json({
      ok: response?.ok,
      error: 0,
      message: response?.message || "Cliente eliminado correctamente",
    });
    
  } catch (error) {
    console.error("client/:id_client - Error eliminando cliente:", error);
    res.status(500).json({ 
      ok: false,
      error: error instanceof Error ? error.message : String(error),
      message: "Error eliminando cliente",
     });
  } finally {
    clientModel = null;
  }
});

superAdminRouter.post("/stores", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_user, name, ...storeData } = req.body;

    if (!id_user || !name) {
      res.status(400).json({ error: "id_user y name son requeridos" });
      return;
    }

    const storeModel = getStoreModel();
    const result = await storeModel.createStore(id_user, { name, ...storeData } as IStore);

    res.status(201).json({
      message: "Tienda creada exitosamente",
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error creando tienda",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

superAdminRouter.post(
  "/create-question",
  async (req: Request, res: Response): Promise<void> => {
    let questionModel: Question | null = null;
    try {
      const {
        id_user,
        question,
        question_type,
        base_price,
        promoter_earns,
        i_status,
        is_multiple,
        min_value,
        max_value,
        max_photos,
        options
      } = req.body;

      if (
        !id_user ||
        !question ||
        base_price === undefined ||
        promoter_earns === undefined
      ) {
        res.status(400).json({
          error:
            "id_user, question, base_price y promoter_earns son requeridos",
        });
        return;
      }

      questionModel = getQuestionModel();
      const result = await questionModel.createQuestion(id_user, {
        id_user,
        question,
        question_type: question_type || 'open',
        base_price,
        promoter_earns,
        i_status,
        is_multiple,
        min_value,
        max_value,
        max_photos,
        options
      });
      res.status(201).json({
        message: "Super admin creo pregunta correctamente",
        data: result,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Error creando pregunta", details: error });
    } finally {
      questionModel = null;
    }
  },
);

superAdminRouter.post(
  "/assign-question-to-client",
  async (req: Request, res: Response): Promise<void> => {
    let questionModel: Question | null = null;
    try {
      const {
        id_user,
        id_question,
        id_client,
        client_price,
        client_promoter_earns,
      } = req.body;

      if (!id_user || !id_question || !id_client) {
        res
          .status(400)
          .json({ error: "id_user, id_question y id_client son requeridos" });
        return;
      }

      questionModel = getQuestionModel();
      const result = await questionModel.asignQuestionToClient(
        id_question,
        id_client,
        id_user,
        client_price,
        client_promoter_earns,
      );
      res.status(201).json({
        message: "Super admin asigno pregunta a cliente correctamente",
        data: result,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error asignando pregunta a cliente", details: error });
    } finally {
      questionModel = null;
    }
  },
);

superAdminRouter.get("/get_clients_list", async (_req: Request, res: Response): Promise<void> => {
    let clientModel: Client | null = null;
    try {
      clientModel = getClientModel();
      const result = await clientModel.getClients();
      res.status(200).json({
        message: "Lista de clientes obtenida correctamente",
        data: result,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error obteniendo lista de clientes", details: error });
    } finally {
      clientModel = null;
    }
  },
);

superAdminRouter.get("/get_client/:id", async (req: Request, res: Response): Promise<void> => {
    let clientModel: Client | null = null;
    try {
      clientModel = getClientModel();
      const result = await clientModel.getClientById(Number(req.params.id));
      res.status(200).json({
        message: "Cliente obtenido correctamente",
        data: result,
      });
    } catch (error) {
      console.error(error);
      res
        .status(500)
        .json({ error: "Error obteniendo cliente", details: error });
    } finally {
      clientModel = null;
    }
  },
);

// Obtener todas las tiendas
superAdminRouter.get("/stores", async (_req: Request, res: Response): Promise<void> => {
  try {
    const storeModel = getStoreModel();
    const stores = await storeModel.getStores();

    res.status(200).json({
      ok: true,
      message: "Tiendas obtenidas exitosamente",
      data: stores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      ok: false,
      error: "Error obteniendo tiendas",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener tienda por ID
superAdminRouter.get("/stores/:id_store", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store } = req.params;

    const storeModel = getStoreModel();
    const store = await storeModel.getStoreById(Number(id_store));

    if (!store) {
      res.status(404).json({ error: "Tienda no encontrada" });
      return;
    }

    res.status(200).json({
      message: "Tienda obtenida exitosamente",
      data: store,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo tienda",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Actualizar tienda
superAdminRouter.put("/stores/:id_store", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store } = req.params;
    const { id_user, ...updateData } = req.body;

    if (!id_user) {
      res.status(400).json({ error: "id_user es requerido" });
      return;
    }

    const storeModel = getStoreModel();
    const result = await storeModel.updateStore(Number(id_store), id_user, updateData);

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error actualizando tienda",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Eliminar tienda (soft delete)
superAdminRouter.delete("/stores/:id_store", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store } = req.params;
    const { id_user } = req.body;

    if (!id_user) {
      res.status(400).json({ error: "id_user es requerido" });
      return;
    }

    const storeModel = getStoreModel();
    const result = await storeModel.deleteStore(Number(id_store), id_user);

    res.status(200).json({
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error eliminando tienda",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

superAdminRouter.post("/stores/:id_store/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store, id_client } = req.params;
    const { id_user_creator } = req.body;

    if (!id_user_creator) {
      res.status(400).json({ error: "id_user_creator es requerido" });
      return;
    }

    const storeModel = getStoreModel();
    const result = await storeModel.assignStoreToClient(
      Number(id_store),
      Number(id_client),
      id_user_creator
    );

    res.status(201).json({
      message: result.message,
      data: result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error asignando tienda al cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Desasignar tienda de cliente
superAdminRouter.delete("/stores/:id_store/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store, id_client } = req.params;

    const storeModel = getStoreModel();
    const result = await storeModel.removeStoreFromClient(Number(id_store), Number(id_client));

    res.status(200).json({
      message: result.message,
      ok: result.ok,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error desasignando tienda del cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener tiendas de un cliente
superAdminRouter.get("/stores/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_client } = req.params;

    const storeModel = getStoreModel();
    const stores = await storeModel.getStoresByClient(Number(id_client));

    res.status(200).json({
      message: "Tiendas del cliente obtenidas exitosamente",
      data: stores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo tiendas del cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener clientes de una tienda
superAdminRouter.get("/stores/:id_store/clients/", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_store } = req.params;

    const storeModel = getStoreModel();
    const clients = await storeModel.getClientsByStore(Number(id_store));

    res.status(200).json({
      message: "Clientes de la tienda obtenidos exitosamente",
      data: clients,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo clientes de la tienda",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener tiendas disponibles para asignar a un cliente
superAdminRouter.get("/stores/clients/available-stores/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_client } = req.params;

    const storeModel = getStoreModel();
    const stores = await storeModel.getAvailableStoresForClient(Number(id_client));

    res.status(200).json({
      message: "Tiendas disponibles obtenidas exitosamente",
      data: stores,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error obteniendo tiendas disponibles",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ==================== QUESTIONS CRUD ====================

// Obtener todas las preguntas
superAdminRouter.get("/questions", async (_req: Request, res: Response): Promise<void> => {
  try {
    const questionModel = getQuestionModel();
    const questions = await questionModel.getQuestions();

    res.status(200).json({
      ok: true,
      message: "Preguntas obtenidas exitosamente",
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo preguntas",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener pregunta por ID
superAdminRouter.get("/questions/:id_question", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question } = req.params;

    const questionModel = getQuestionModel();
    const question = await questionModel.getQuestionById(Number(id_question));

    if (!question) {
      res.status(404).json({
        ok: false,
        message: "Pregunta no encontrada",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: "Pregunta obtenida exitosamente",
      data: question,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo pregunta",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Crear pregunta
superAdminRouter.post("/questions", async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      id_user,
      question,
      question_type,
      base_price,
      promoter_earns,
      i_status,
      is_multiple,
      min_value,
      max_value,
      max_photos,
      options
    } = req.body;

    if (!id_user || !question || base_price === undefined || promoter_earns === undefined) {
      res.status(400).json({
        ok: false,
        error: "id_user, question, base_price y promoter_earns son requeridos",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.createQuestion(id_user, {
      id_user,
      question,
      question_type: question_type || 'open',
      base_price,
      promoter_earns,
      i_status: i_status ?? true,
      is_multiple,
      min_value,
      max_value,
      max_photos,
      options
    });

    res.status(201).json({
      ok: true,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error creando pregunta",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Actualizar pregunta
superAdminRouter.put("/questions/:id_question", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question } = req.params;
    const {
      id_user,
      question,
      question_type,
      base_price,
      promoter_earns,
      i_status,
      is_multiple,
      min_value,
      max_value,
      max_photos,
      options
    } = req.body;

    if (!id_user) {
      res.status(400).json({
        ok: false,
        error: "id_user es requerido",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.updateQuestion(Number(id_question), id_user, {
      question,
      question_type,
      base_price,
      promoter_earns,
      i_status,
      is_multiple,
      min_value,
      max_value,
      max_photos,
      options
    });

    res.status(200).json({
      ok: true,
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error actualizando pregunta",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Eliminar pregunta (soft delete)
superAdminRouter.delete("/questions/:id_question", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question } = req.params;
    const { id_user } = req.body;

    if (!id_user) {
      res.status(400).json({
        ok: false,
        error: "id_user es requerido",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.deleteQuestion(Number(id_question), id_user);

    res.status(200).json({
      ok: true,
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error eliminando pregunta",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// ==================== QUESTIONS - ASIGNACIÓN A CLIENTES ====================

// Asignar pregunta a cliente
superAdminRouter.post("/questions/:id_question/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question, id_client } = req.params;
    const { id_user, client_price, client_promoter_earns } = req.body;

    if (!id_user) {
      res.status(400).json({
        ok: false,
        error: "id_user es requerido",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.assignQuestionToClient(
      Number(id_question),
      Number(id_client),
      id_user,
      client_price || 0,
      client_promoter_earns || 0
    );

    res.status(201).json({
      ok: true,
      message: result.message,
      data: { id: result.id },
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error asignando pregunta al cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Desasignar pregunta de cliente
superAdminRouter.delete("/questions/:id_question/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question, id_client } = req.params;
    const { id_user } = req.body;

    if (!id_user) {
      res.status(400).json({
        ok: false,
        error: "id_user es requerido",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.unassignQuestionFromClient(
      Number(id_question),
      Number(id_client),
      id_user
    );

    res.status(200).json({
      ok: result.ok,
      message: result.message,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error desasignando pregunta del cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Actualizar precios de pregunta-cliente
superAdminRouter.put("/questions-client/:id_question_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question_client } = req.params;
    const { id_user, client_price, client_promoter_earns } = req.body;

    if (!id_user) {
      res.status(400).json({
        ok: false,
        error: "id_user es requerido",
      });
      return;
    }

    const questionModel = getQuestionModel();
    const result = await questionModel.updateQuestionClientPricing(
      Number(id_question_client),
      id_user,
      { client_price, client_promoter_earns }
    );

    res.status(200).json({
      ok: true,
      message: result.message,
      success: result.success,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error actualizando precios",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener preguntas asignadas a un cliente
superAdminRouter.get("/questions/clients/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_client } = req.params;

    const questionModel = getQuestionModel();
    const questions = await questionModel.getQuestionsByClient(Number(id_client));

    res.status(200).json({
      ok: true,
      message: "Preguntas del cliente obtenidas exitosamente",
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo preguntas del cliente",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener clientes asignados a una pregunta
superAdminRouter.get("/questions/:id_question/clients", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question } = req.params;

    const questionModel = getQuestionModel();
    const clients = await questionModel.getClientsByQuestion(Number(id_question));

    res.status(200).json({
      ok: true,
      message: "Clientes de la pregunta obtenidos exitosamente",
      data: clients,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo clientes de la pregunta",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener preguntas disponibles para asignar a un cliente
superAdminRouter.get("/questions/clients/available/:id_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_client } = req.params;

    const questionModel = getQuestionModel();
    const questions = await questionModel.getAvailableQuestionsForClient(Number(id_client));

    res.status(200).json({
      ok: true,
      message: "Preguntas disponibles obtenidas exitosamente",
      data: questions,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo preguntas disponibles",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

// Obtener detalle de asignación pregunta-cliente
superAdminRouter.get("/questions-client/:id_question_client", async (req: Request, res: Response): Promise<void> => {
  try {
    const { id_question_client } = req.params;

    const questionModel = getQuestionModel();
    const data = await questionModel.getQuestionClientById(Number(id_question_client));

    if (!data) {
      res.status(404).json({
        ok: false,
        message: "Asignación no encontrada",
      });
      return;
    }

    res.status(200).json({
      ok: true,
      message: "Asignación obtenida exitosamente",
      data,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error obteniendo asignación",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

superAdminRouter.get('/analytics/dashboard', async (req: Request, res: Response): Promise<void> => {
  try {
    const { dateFrom, dateTo } = req.query;

    if (!dateFrom || !dateTo) {
      res.status(400).json({
        ok: false,
        error: 'dateFrom y dateTo son requeridos',
      });
      return;
    }
    const clientModel = getClientModel();
    const analytics = await clientModel.getDashboardAnalytics(String(dateFrom), String(dateTo));

    res.status(200).json({
      ok: true,
      message: 'Datos analíticos obtenidos exitosamente',
      data: analytics,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: 'Error obteniendo datos analíticos',
      details: error instanceof Error ? error.message : String(error),
    });
  }
});


// ==================== TEST PUSH NOTIFICATION ====================

superAdminRouter.post("/test-push-notification", async (req: Request, res: Response): Promise<void> => {
  try {
    const { fcm_token, title, body } = req.body;

    if (!fcm_token) {
      res.status(400).json({ ok: false, error: "fcm_token es requerido" });
      return;
    }

    const result = await NotificationService.sendPushNotification(fcm_token, {
      title: title || "Notificación de prueba",
      body: body || "Esta es una notificación de prueba desde el servidor.",
    });

    res.status(200).json({
      ok: true,
      message: "Notificación enviada exitosamente",
      data: result,
    });
  } catch (error) {
    res.status(500).json({
      ok: false,
      error: "Error enviando notificación",
      details: error instanceof Error ? error.message : String(error),
    });
  }
});

export default superAdminRouter;

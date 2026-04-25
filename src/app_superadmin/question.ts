import { IQuestion, ICreateQuestionPayload, ICreateOptionPayload, QuestionType } from "../core/interfaces/question";
import db from '../config/database';
import { Database } from '../core/database';
import { Utils } from '../core/utils';

const VALID_QUESTION_TYPES: QuestionType[] = ['open', 'options', 'yes_no', 'numeric', 'date', 'photo'];

export class Question {
    protected db: Database = db;

    constructor() {}

    // ==================== VALIDACIONES ====================

    private validateQuestionType(type: string): type is QuestionType {
        return VALID_QUESTION_TYPES.includes(type as QuestionType);
    }

    private validateQuestionData(data: ICreateQuestionPayload): { valid: boolean; error?: string } {
        const questionType = data.question_type || 'open';

        if (!this.validateQuestionType(questionType)) {
            return { valid: false, error: `Tipo de pregunta inválido. Valores permitidos: ${VALID_QUESTION_TYPES.join(', ')}` };
        }

        // Validación para tipo 'options'
        if (questionType === 'options') {
            if (!data.options || data.options.length < 2) {
                return { valid: false, error: "Las preguntas de tipo 'options' requieren al menos 2 opciones" };
            }
        }

        // Validación para tipo 'numeric'
        if (questionType === 'numeric') {
            if (data.min_value !== undefined && data.max_value !== undefined) {
                if (data.min_value > data.max_value) {
                    return { valid: false, error: "min_value no puede ser mayor que max_value" };
                }
            }
        }

        // Validación para tipo 'photo'
        if (questionType === 'photo') {
            const maxPhotos = data.max_photos ?? 1;
            if (maxPhotos < 1 || maxPhotos > 10) {
                return { valid: false, error: "max_photos debe estar entre 1 y 10" };
            }
        }

        return { valid: true };
    }

    // ==================== CRUD QUESTIONS ====================

    async createQuestion(id_user: number, questionData: ICreateQuestionPayload) {
        let commit = false;
        try {
            // Validar datos
            const validation = this.validateQuestionData(questionData);
            if (!validation.valid) {
                throw new Error(validation.error);
            }

            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            const questionType = questionData.question_type || 'open';

            // Construir query dinámicamente
            let fields = ["id_user", "question", "question_type", "base_price", "promoter_earns"];
            let placeholders = ["?", "?", "?", "?", "?"];
            let params: any[] = [id_user, questionData.question, questionType, questionData.base_price, questionData.promoter_earns];

            if (questionData.i_status !== undefined) {
                fields.push("i_status");
                placeholders.push("?");
                params.push(questionData.i_status ? 1 : 0);
            }

            // Campos específicos por tipo
            if (questionType === 'options' && questionData.is_multiple !== undefined) {
                fields.push("is_multiple");
                placeholders.push("?");
                params.push(questionData.is_multiple ? 1 : 0);
            }

            if (questionType === 'numeric') {
                if (questionData.min_value !== undefined) {
                    fields.push("min_value");
                    placeholders.push("?");
                    params.push(questionData.min_value);
                }
                if (questionData.max_value !== undefined) {
                    fields.push("max_value");
                    placeholders.push("?");
                    params.push(questionData.max_value);
                }
            }

            if (questionType === 'photo') {
                fields.push("max_photos");
                placeholders.push("?");
                params.push(questionData.max_photos ?? 1);
            }

            const query = `INSERT INTO questions(${fields.join(", ")}) VALUES (${placeholders.join(", ")})`;
            const result = await this.db.execute(query, params);

            const id_question = result.insertId;

            // Insertar opciones si es tipo 'options'
            if (questionType === 'options' && questionData.options && questionData.options.length > 0) {
                await this.insertOptions(id_question, questionData.options);
            }
            
            if (commit) {
                await this.db.commit();
            }

            return {
                id: id_question,
                message: "Pregunta creada exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    private async insertOptions(id_question: number, options: ICreateOptionPayload[]) {
        for (const option of options) {
            const query = `
                INSERT INTO question_options (id_question, option_text, option_value_numeric, option_value_text, option_order)
                VALUES (?, ?, ?, ?, ?)
            `;
            await this.db.execute(query, [
                id_question,
                option.option_text,
                option.option_value_numeric ?? null,
                option.option_value_text ?? null,
                option.option_order
            ]);
        }
    }

    async getQuestions() {
        try {
            const query = `
                SELECT
                    q.id_question,
                    q.id_user,
                    q.question,
                    q.question_type,
                    q.base_price,
                    q.promoter_earns,
                    q.i_status,
                    q.is_multiple,
                    q.min_value,
                    q.max_value,
                    q.max_photos,
                    q.dt_register,
                    q.dt_updated,
                    u.name as created_by_name,
                    u.email as created_by_email
                FROM questions q
                INNER JOIN users u ON q.id_user = u.id_user
                WHERE q.i_status = 1
                ORDER BY q.dt_register DESC
            `;
            return await this.db.select(query);
        } catch (error) {
            throw error;
        }
    }

    async getQuestionById(id_question: number) {
        try {
            const query = `
                SELECT
                    q.id_question,
                    q.id_user,
                    q.question,
                    q.question_type,
                    q.base_price,
                    q.promoter_earns,
                    q.i_status,
                    q.is_multiple,
                    q.min_value,
                    q.max_value,
                    q.max_photos,
                    q.dt_register,
                    q.dt_updated,
                    u.name as created_by_name,
                    u.email as created_by_email
                FROM questions q
                INNER JOIN users u ON q.id_user = u.id_user
                WHERE q.id_question = ?
            `;
            const result = await this.db.select(query, [id_question]);

            if (result.length === 0) {
                return null;
            }

            const question = result[0];

            // Si es tipo 'options', obtener las opciones
            if (question.question_type === 'options') {
                question.options = await this.getOptionsByQuestion(id_question);
            }

            return question;
        } catch (error) {
            throw error;
        }
    }

    async getOptionsByQuestion(id_question: number) {
        try {
            const query = `
                SELECT
                    id_option,
                    id_question,
                    option_text,
                    option_value_numeric,
                    option_value_text,
                    option_order,
                    i_status,
                    dt_register
                FROM question_options
                WHERE id_question = ? AND i_status = 1
                ORDER BY option_order ASC
            `;
            return await this.db.select(query, [id_question]);
        } catch (error) {
            throw error;
        }
    }

    async selectQuestionById(id_question: number) {
        try {
            const query = "SELECT * FROM questions WHERE id_question = ?";
            const result = await this.db.select(query, [id_question]);
            return result.length > 0 ? result[0] : null;
        } catch (error) {
            throw error;
        }
    }

    async updateQuestion(
        id_question: number,
        id_user: number,
        data: {
            question?: string;
            question_type?: QuestionType;
            base_price?: number;
            promoter_earns?: number;
            i_status?: boolean;
            is_multiple?: boolean;
            min_value?: number;
            max_value?: number;
            max_photos?: number;
            options?: ICreateOptionPayload[];
        }
    ) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            // Obtener pregunta actual para comparar tipo
            const currentQuestion = await this.selectQuestionById(id_question);
            if (!currentQuestion) {
                throw new Error("La pregunta no existe");
            }

            const newType = data.question_type || currentQuestion.question_type || 'open';
            const typeChanged = newType !== currentQuestion.question_type;

            // Validar nuevo tipo si cambió
            if (data.question_type && !this.validateQuestionType(data.question_type)) {
                throw new Error(`Tipo de pregunta inválido. Valores permitidos: ${VALID_QUESTION_TYPES.join(', ')}`);
            }

            // Si cambia a 'options', validar que tenga opciones
            if (newType === 'options' && typeChanged) {
                if (!data.options || data.options.length < 2) {
                    throw new Error("Las preguntas de tipo 'options' requieren al menos 2 opciones");
                }
            }

            // Validar numeric
            if (newType === 'numeric') {
                const minVal = data.min_value ?? currentQuestion.min_value;
                const maxVal = data.max_value ?? currentQuestion.max_value;
                if (minVal !== undefined && maxVal !== undefined && minVal > maxVal) {
                    throw new Error("min_value no puede ser mayor que max_value");
                }
            }

            // Validar photo
            if (newType === 'photo') {
                const maxPhotos = data.max_photos ?? currentQuestion.max_photos ?? 1;
                if (maxPhotos < 1 || maxPhotos > 10) {
                    throw new Error("max_photos debe estar entre 1 y 10");
                }
            }

            const fields: string[] = [];
            const values: any[] = [];
            const changes: string[] = [];

            if (data.question !== undefined) {
                fields.push("question = ?");
                values.push(data.question);
                changes.push("texto actualizado");
            }

            if (data.question_type !== undefined) {
                fields.push("question_type = ?");
                values.push(data.question_type);
                changes.push(`tipo: ${data.question_type}`);
            }

            if (data.base_price !== undefined) {
                fields.push("base_price = ?");
                values.push(data.base_price);
                changes.push(`precio base: ${data.base_price}`);
            }

            if (data.promoter_earns !== undefined) {
                fields.push("promoter_earns = ?");
                values.push(data.promoter_earns);
                changes.push(`ganancia promotor: ${data.promoter_earns}`);
            }

            if (data.i_status !== undefined) {
                fields.push("i_status = ?");
                values.push(data.i_status ? 1 : 0);
                changes.push(`estado: ${data.i_status ? 'activo' : 'inactivo'}`);
            }

            // Campos específicos por tipo
            if (newType === 'options') {
                if (data.is_multiple !== undefined) {
                    fields.push("is_multiple = ?");
                    values.push(data.is_multiple ? 1 : 0);
                    changes.push(`múltiple: ${data.is_multiple}`);
                }
                // Limpiar campos de otros tipos
                fields.push("min_value = NULL, max_value = NULL, max_photos = 1");
            } else if (newType === 'numeric') {
                if (data.min_value !== undefined) {
                    fields.push("min_value = ?");
                    values.push(data.min_value);
                    changes.push(`min: ${data.min_value}`);
                }
                if (data.max_value !== undefined) {
                    fields.push("max_value = ?");
                    values.push(data.max_value);
                    changes.push(`max: ${data.max_value}`);
                }
                // Limpiar campos de otros tipos
                fields.push("is_multiple = 0, max_photos = 1");
            } else if (newType === 'photo') {
                if (data.max_photos !== undefined) {
                    fields.push("max_photos = ?");
                    values.push(data.max_photos);
                    changes.push(`max fotos: ${data.max_photos}`);
                }
                // Limpiar campos de otros tipos
                fields.push("is_multiple = 0, min_value = NULL, max_value = NULL");
            } else {
                // Para open, yes_no, date - limpiar todos los campos específicos
                fields.push("is_multiple = 0, min_value = NULL, max_value = NULL, max_photos = 1");
            }

            if (fields.length === 0) {
                if (commit) await this.db.rollback();
                return { success: false, message: "No hay campos para actualizar" };
            }

            values.push(id_question);

            const query = `UPDATE questions SET ${fields.join(", ")} WHERE id_question = ?`;
            await this.db.execute(query, values);

            // Si cambia el tipo y el anterior era 'options', eliminar opciones antiguas
            if (typeChanged && currentQuestion.question_type === 'options') {
                await this.deleteOptionsByQuestion(id_question);
            }

            // Si el nuevo tipo es 'options' y se enviaron opciones, reemplazar
            if (newType === 'options' && data.options && data.options.length > 0) {
                await this.deleteOptionsByQuestion(id_question);
                await this.insertOptions(id_question, data.options);
                changes.push(`opciones actualizadas (${data.options.length})`);
            }


            if (commit) {
                await this.db.commit();
            }

            return { success: true, message: "Pregunta actualizada exitosamente" };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    private async deleteOptionsByQuestion(id_question: number) {
        const query = "DELETE FROM question_options WHERE id_question = ?";
        await this.db.execute(query, [id_question]);
    }

    async deleteQuestion(id_question: number, id_user: number) {
        try {
            const query = `UPDATE questions SET i_status = 0 WHERE id_question = ?`;
            await this.db.execute(query, [id_question]);

            return { success: true, message: "Pregunta eliminada exitosamente" };
        } catch (error) {
            throw error;
        }
    }

    // ==================== ASIGNACIÓN A CLIENTES ====================

    async assignQuestionToClient(
        id_question: number,
        id_client: number,
        id_user: number,
        client_price: number = 0,
        client_promoter_earns: number = 0
    ) {
        let commit = false;
        try {
            if (!this.db.inTransaction) {
                await this.db.beginTransaction();
                commit = true;
            }

            const question = await this.selectQuestionById(id_question);

            if (!question) {
                throw new Error("La pregunta no existe");
            }

            // Verificar si ya está asignada
            const existingAssignment = await this.db.select(
                "SELECT id_question_client FROM questions_client WHERE id_question = ? AND id_client = ? AND i_status = 1",
                [id_question, id_client]
            );

            if (existingAssignment.length > 0) {
                throw new Error("La pregunta ya está asignada a este cliente");
            }

            // Usar precios base si no se especifican
            if (client_price === 0) {
                client_price = question.base_price;
            }

            if (client_promoter_earns === 0) {
                client_promoter_earns = question.promoter_earns;
            }

            const query = "INSERT INTO questions_client (id_question, id_client, id_user, client_price, client_promoter_earns) VALUES (?, ?, ?, ?, ?)";
            const result = await this.db.execute(query, [id_question, id_client, id_user, client_price, client_promoter_earns]);

            if (commit) {
                await this.db.commit();
            }

            return {
                id: result.insertId,
                message: "Pregunta asignada al cliente exitosamente"
            };
        } catch (error) {
            if (commit) {
                await this.db.rollback();
            }
            throw error;
        }
    }

    async unassignQuestionFromClient(id_question: number, id_client: number, id_user: number) {
        try {
            // Obtener el id_question_client antes de desactivar
            const assignment = await this.db.select(
                "SELECT id_question_client FROM questions_client WHERE id_question = ? AND id_client = ? AND i_status = 1",
                [id_question, id_client]
            );

            if (assignment.length === 0) {
                return { ok: false, message: "La asignación no existe o ya fue eliminada" };
            }

            const id_question_client = assignment[0].id_question_client;

            const query = `UPDATE questions_client SET i_status = 0 WHERE id_question = ? AND id_client = ?`;
            await this.db.execute(query, [id_question, id_client]);

            return { ok: true, message: "Pregunta desasignada del cliente exitosamente" };
        } catch (error) {
            throw error;
        }
    }

    async updateQuestionClientPricing(
        id_question_client: number,
        id_user: number,
        data: { client_price?: number; client_promoter_earns?: number }
    ) {
        try {
            const fields: string[] = [];
            const values: any[] = [];
            const changes: string[] = [];

            if (data.client_price !== undefined) {
                fields.push("client_price = ?");
                values.push(data.client_price);
                changes.push(`precio cliente: ${data.client_price}`);
            }

            if (data.client_promoter_earns !== undefined) {
                fields.push("client_promoter_earns = ?");
                values.push(data.client_promoter_earns);
                changes.push(`ganancia promotor: ${data.client_promoter_earns}`);
            }

            if (fields.length === 0) {
                return { success: false, message: "No hay campos para actualizar" };
            }

            values.push(id_question_client);

            const query = `UPDATE questions_client SET ${fields.join(", ")} WHERE id_question_client = ?`;
            await this.db.execute(query, values);


            return { success: true, message: "Precios actualizados exitosamente" };
        } catch (error) {
            throw error;
        }
    }

    // ==================== CONSULTAS ====================

    async getQuestionsByClient(id_client: number) {
        try {
            const query = `
                SELECT
                    qc.id_question_client,
                    qc.id_question,
                    qc.id_client,
                    qc.client_price,
                    qc.client_promoter_earns,
                    qc.i_status as assignment_status,
                    qc.dt_register as assigned_at,
                    q.question,
                    q.question_type,
                    q.base_price,
                    q.promoter_earns,
                    q.is_multiple,
                    q.min_value,
                    q.max_value,
                    q.max_photos,
                    q.i_status as question_status
                FROM questions_client qc
                INNER JOIN questions q ON qc.id_question = q.id_question
                WHERE qc.id_client = ? AND qc.i_status = 1 AND q.i_status = 1
                ORDER BY qc.dt_register DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            throw error;
        }
    }

    async getClientsByQuestion(id_question: number) {
        try {
            const query = `
                SELECT
                    qc.id_question_client,
                    qc.id_client,
                    qc.client_price,
                    qc.client_promoter_earns,
                    qc.dt_register as assigned_at,
                    c.name as client_name
                FROM questions_client qc
                INNER JOIN clients c ON qc.id_client = c.id_client
                WHERE qc.id_question = ? AND qc.i_status = 1
                ORDER BY c.name ASC
            `;
            return await this.db.select(query, [id_question]);
        } catch (error) {
            throw error;
        }
    }

    async getAvailableQuestionsForClient(id_client: number) {
        try {
            const query = `
                SELECT
                    q.id_question,
                    q.question,
                    q.question_type,
                    q.base_price,
                    q.promoter_earns,
                    q.is_multiple,
                    q.min_value,
                    q.max_value,
                    q.max_photos,
                    q.dt_register
                FROM questions q
                WHERE q.i_status = 1
                AND q.id_question NOT IN (
                    SELECT id_question
                    FROM questions_client
                    WHERE id_client = ? AND i_status = 1
                )
                ORDER BY q.dt_register DESC
            `;
            return await this.db.select(query, [id_client]);
        } catch (error) {
            throw error;
        }
    }

    async getQuestionClientById(id_question_client: number) {
        try {
            const query = `
                SELECT
                    qc.id_question_client,
                    qc.id_question,
                    qc.id_client,
                    qc.id_user,
                    qc.client_price,
                    qc.client_promoter_earns,
                    qc.i_status,
                    qc.dt_register,
                    qc.dt_updated,
                    q.question,
                    q.question_type,
                    q.base_price,
                    q.promoter_earns,
                    q.is_multiple,
                    q.min_value,
                    q.max_value,
                    q.max_photos,
                    c.name as client_name
                FROM questions_client qc
                INNER JOIN questions q ON qc.id_question = q.id_question
                INNER JOIN clients c ON qc.id_client = c.id_client
                WHERE qc.id_question_client = ?
            `;
            const result = await this.db.select(query, [id_question_client]);

            if (result.length === 0) {
                return null;
            }

            const questionClient = result[0];

            // Si es tipo 'options', obtener las opciones
            if (questionClient.question_type === 'options') {
                questionClient.options = await this.getOptionsByQuestion(questionClient.id_question);
            }

            return questionClient;
        } catch (error) {
            throw error;
        }
    }

    // Mantener compatibilidad con el nombre anterior
    async asignQuestionToClient(
        id_question: number,
        id_client: number,
        id_user: number,
        client_price: number = 0,
        client_promoter_earns: number = 0
    ) {
        return this.assignQuestionToClient(id_question, id_client, id_user, client_price, client_promoter_earns);
    }
}

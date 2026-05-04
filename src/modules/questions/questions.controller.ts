import { Request, Response } from 'express'


import { Questions } from './questions.service'
import { CreateQuestionDto, AssignClientsToQuestionDto } from './questions.dtos'

const questionService = new Questions()


export const createQuestion = async (req: Request, res: Response) => {
    try {
        const body: CreateQuestionDto = req.body;
        const question = await questionService.createQuestion(body);
        res.status(201).json({
            ok: true,
            error: 0,
            data: question,
            message: "Pregunta creada exitosamente."
        });
    } catch (error) {
        console.error("Error creating question:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al crear la pregunta.",
            error_backend: error instanceof Error ? error.message : String(error) 
        });
    }
}

export const getQuestionList = async (req: Request, res: Response) => {
    try {
        const id_client = req.params.id_client ? parseInt(req.params.id_client as string, 10) : undefined;
        const questions = await questionService.getQuestionList(id_client);
        res.status(200).json({
            ok: true,
            error: 0,
            data: questions,
            message: "Lista de preguntas obtenida exitosamente."
        });
    } catch (error) {
        console.error("Error fetching question list:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al obtener la lista de preguntas.",
            error_backend: error instanceof Error ? error.message : String(error)
        });
    }
}

export const getQuestionById = async (req: Request, res: Response) => {
    try {
        const id_question = req.params.id_question;
        const question = await questionService.getQuestionById(Number(id_question));
        if (!question) {
            return res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: "Pregunta no encontrada."
            });
        }
        res.status(200).json({
            ok: true,
            error: 0,
            data: question,
            message: "Pregunta obtenida exitosamente."
        });
    } catch (error) {
        console.error("Error fetching question by ID:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al obtener la pregunta.",
            error_backend: error instanceof Error ? error.message : String(error)
        });
    }
}

export const updateQuestion = async(req: Request, res: Response) => {
    try {
        const id_question = req.params.id_question;
        const body: CreateQuestionDto = req.body;
        const question = await questionService.updateQuestion(Number(id_question), body);
        if (!question) {
            return res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: "Pregunta no encontrada."
            });
        }
        res.status(200).json({
            ok: true,
            error: 0,
            data: question,
            message: "Pregunta actualizada exitosamente."
        });
    } catch (error) {
        console.error("Error updating question:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al actualizar la pregunta.",
            error_backend: error instanceof Error ? error.message : String(error)
        });
    }
}

export const assignClientsToQuestion = async(req: Request, res: Response) => {
    try {
        const id_question = req.params.id_question;
        const body: AssignClientsToQuestionDto = req.body;
        const question = await questionService.assignClientsToQuestion(Number(id_question), body);
        if (!question) {
            return res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: "Pregunta no encontrada."
            });
        }
        res.status(200).json({
            ok: true,
            error: 0,
            data: question,
            message: "Clientes asignados a la pregunta exitosamente."
        });
    } catch (error) {
        console.error("Error assigning clients to question:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al asignar clientes a la pregunta.",
            error_backend: error instanceof Error ? error.message : String(error)
        });
    }
}

export const deleteQuestion = async(req: Request, res: Response) => {
    try {
        const id_question = req.params.id_question;
        const question = await questionService.deleteQuestion(Number(id_question));
        if (!question) {
            return res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: "Pregunta no encontrada."
            });
        }
        res.status(200).json({
            ok: true,
            error: 0,
            data: question,
            message: "Pregunta eliminada exitosamente."
        });
    } catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: "Un error ocurrio al eliminar la pregunta.",
            error_backend: error instanceof Error ? error.message : String(error)
        });
    }
}

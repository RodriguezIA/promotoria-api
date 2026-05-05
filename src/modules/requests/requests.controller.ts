import { Request, Response } from 'express'
import { Request as RequestService } from './requests.service'
import { UploadService } from '../../services/upload.service'
import { CreateRequestDTO, UpdateRequestDTO, RequestFiltersDTO } from './requests.dtos'

const requestService = new RequestService()

function parseNumber(value: any): number | undefined {
    if (value === undefined || value === null || value === '') return undefined
    const num = Number(value)
    return isNaN(num) ? undefined : num
}

function parseProducts(value: any): any[] | undefined {
    if (!value) return undefined
    if (Array.isArray(value)) return value
    try {
        const parsed = JSON.parse(value)
        return Array.isArray(parsed) ? parsed : undefined
    } catch {
        return undefined
    }
}

export const createRequest = async (req: Request, res: Response) => {
    try {
        const body = req.body
        const products = parseProducts(body.products)

        let url_rack_image = body.url_rack_image

        if (req.file) {
            const tempRequestId = Date.now()
            url_rack_image = await UploadService.uploadRequestImage(tempRequestId, req.file.buffer)
        }

        const payload: CreateRequestDTO = {
            id_user: parseNumber(body.id_user)!,
            id_client: parseNumber(body.id_client)!,
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value)!,
            url_rack_image,
            products,
        }

        const request = await requestService.createRequest(payload)

        if (req.file && request.id_request) {
            const finalUrl = await UploadService.uploadRequestImage(request.id_request, req.file.buffer)
            await requestService.updateRequest(request.id_request, { url_rack_image: finalUrl })
            request.url_rack_image = finalUrl
        }

        res.status(200).json({
            ok: true,
            error: 0,
            data: request,
            message: 'Solicitud creada exitosamente'
        })
    } catch (error) {
        console.error('CREATE REQUEST ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al crear la solicitud',
            error_backend: error
        })
    }
}

export const getAllRequests = async (req: Request, res: Response) => {
    try {
        const filters: RequestFiltersDTO = {
            id_client: parseNumber(req.query.id_client),
            id_user: parseNumber(req.query.id_user),
            id_status: parseNumber(req.query.id_status),
            b_active: req.query.b_active !== undefined ? req.query.b_active === 'true' : undefined,
            page: parseNumber(req.query.page),
            limit: parseNumber(req.query.limit),
        }

        const result = await requestService.getAllRequests(filters)

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: 'Solicitudes obtenidas exitosamente'
        })
    } catch (error) {
        console.error('GET ALL REQUESTS ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener las solicitudes',
            error_backend: error
        })
    }
}

export const getRequestById = async (req: Request, res: Response) => {
    try {
        const { id_request } = req.params
        const request = await requestService.getRequestById(Number(id_request))

        if (!request) {
            res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: 'Solicitud no encontrada'
            })
            return
        }

        res.status(200).json({
            ok: true,
            error: 0,
            data: request,
            message: 'Solicitud obtenida exitosamente'
        })
    } catch (error) {
        console.error('GET REQUEST BY ID ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al obtener la solicitud',
            error_backend: error
        })
    }
}

export const updateRequest = async (req: Request, res: Response) => {
    try {
        const { id_request } = req.params
        const body = req.body
        const products = parseProducts(body.products)

        const existing = await requestService.getRequestById(Number(id_request))
        if (!existing) {
            res.status(404).json({
                ok: false,
                error: 1,
                data: null,
                message: 'Solicitud no encontrada'
            })
            return
        }

        let url_rack_image = body.url_rack_image

        if (req.file) {
            url_rack_image = await UploadService.uploadRequestImage(Number(id_request), req.file.buffer)
        } else if (!url_rack_image) {
            url_rack_image = existing.url_rack_image ?? undefined
        }

        const payload: UpdateRequestDTO = {
            id_user: parseNumber(body.id_user),
            id_client: parseNumber(body.id_client),
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value),
            url_rack_image,
            id_status: parseNumber(body.id_status),
            products,
        }

        const request = await requestService.updateRequest(Number(id_request), payload)

        res.status(200).json({
            ok: true,
            error: 0,
            data: request,
            message: 'Solicitud actualizada exitosamente'
        })
    } catch (error) {
        console.error('UPDATE REQUEST ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al actualizar la solicitud',
            error_backend: error
        })
    }
}

export const deleteRequest = async (req: Request, res: Response) => {
    try {
        const { id_request } = req.params
        const result = await requestService.deleteRequest(Number(id_request))

        res.status(200).json({
            ok: true,
            error: 0,
            data: result,
            message: 'Solicitud eliminada exitosamente'
        })
    } catch (error) {
        console.error('DELETE REQUEST ERROR:', (error as any).message)
        res.status(500).json({
            ok: false,
            error: 1,
            data: null,
            message: 'Error al eliminar la solicitud',
            error_backend: error
        })
    }
}

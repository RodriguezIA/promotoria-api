import io

cambios = 0

def leer(path):
    with io.open(path, "r", encoding="utf-8") as f:
        return f.read()

def escribir(path, content):
    with io.open(path, "w", encoding="utf-8") as f:
        f.write(content)

# ---------- 1. requests.dtos.ts ----------
path1 = "src/modules/requests/requests.dtos.ts"
c1 = leer(path1)
if "preorder_date_mode" in c1:
    print("YA ESTABA: requests.dtos.ts ya tiene preorder_date_mode")
else:
    old1 = """export interface CreateRequestDTO {
    id_user: number;
    id_client: number;
    vc_name: string;
    f_value: number;
    url_rack_image?: string;
    /// Extra "Prepedido": si esta activo, el promotor puede levantar un
    /// pedido con el encargado de la tienda cuando falten piezas.
    b_preorder?: boolean;
    products?: CreateRequestProductDTO[];
}

export interface UpdateRequestDTO {
    id_user?: number;
    id_client?: number;
    vc_name?: string;
    f_value?: number;
    url_rack_image?: string;
    id_status?: number;
    b_preorder?: boolean;
    products?: UpdateRequestProductDTO[];
}"""
    new1 = """export interface CreateRequestDTO {
    id_user: number;
    id_client: number;
    vc_name: string;
    f_value: number;
    url_rack_image?: string;
    /// Extra "Prepedido": si esta activo, el promotor puede levantar un
    /// pedido con el encargado de la tienda cuando falten piezas.
    b_preorder?: boolean;
    /// Solo aplica si b_preorder es true. 'ABIERTA': el encargado elige
    /// fecha/turno de entrega. 'CERRADA': se asigna segun la ruta del cliente.
    preorder_date_mode?: string;
    products?: CreateRequestProductDTO[];
}

export interface UpdateRequestDTO {
    id_user?: number;
    id_client?: number;
    vc_name?: string;
    f_value?: number;
    url_rack_image?: string;
    id_status?: number;
    b_preorder?: boolean;
    preorder_date_mode?: string;
    products?: UpdateRequestProductDTO[];
}"""
    assert c1.count(old1) == 1, "No encontre las interfaces esperadas en requests.dtos.ts"
    c1 = c1.replace(old1, new1)
    escribir(path1, c1)
    print("OK: requests.dtos.ts actualizado")
    cambios += 1

# ---------- 2. requests.controller.ts ----------
path2 = "src/modules/requests/requests.controller.ts"
c2 = leer(path2)
if "preorder_date_mode" in c2:
    print("YA ESTABA: requests.controller.ts ya tiene preorder_date_mode")
else:
    old_create = """        const payload: CreateRequestDTO = {
            id_user,
            id_client,
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value)!,
            url_rack_image: body.url_rack_image,
            b_preorder: parseBoolean(body.b_preorder),
            products,
        }"""
    new_create = """        if (body.preorder_date_mode && body.preorder_date_mode !== 'ABIERTA' && body.preorder_date_mode !== 'CERRADA') {
            res.status(400).json({ ok: false, error: 1, data: null, message: "preorder_date_mode debe ser 'ABIERTA' o 'CERRADA'" })
            return
        }
        const payload: CreateRequestDTO = {
            id_user,
            id_client,
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value)!,
            url_rack_image: body.url_rack_image,
            b_preorder: parseBoolean(body.b_preorder),
            preorder_date_mode: body.preorder_date_mode,
            products,
        }"""
    assert c2.count(old_create) == 1, "No encontre el payload de create esperado en requests.controller.ts"
    c2 = c2.replace(old_create, new_create)

    old_update = """        const payload: UpdateRequestDTO = {
            id_user: parseNumber(body.id_user),
            id_client: parseNumber(body.id_client),
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value),
            url_rack_image,
            id_status: parseNumber(body.id_status),
            b_preorder: parseBoolean(body.b_preorder),
            products,
        }"""
    new_update = """        if (body.preorder_date_mode && body.preorder_date_mode !== 'ABIERTA' && body.preorder_date_mode !== 'CERRADA') {
            res.status(400).json({ ok: false, error: 1, data: null, message: "preorder_date_mode debe ser 'ABIERTA' o 'CERRADA'" })
            return
        }
        const payload: UpdateRequestDTO = {
            id_user: parseNumber(body.id_user),
            id_client: parseNumber(body.id_client),
            vc_name: body.vc_name,
            f_value: parseNumber(body.f_value),
            url_rack_image,
            id_status: parseNumber(body.id_status),
            b_preorder: parseBoolean(body.b_preorder),
            preorder_date_mode: body.preorder_date_mode,
            products,
        }"""
    assert c2.count(old_update) == 1, "No encontre el payload de update esperado en requests.controller.ts"
    c2 = c2.replace(old_update, new_update)

    escribir(path2, c2)
    print("OK: requests.controller.ts actualizado")
    cambios += 1

# ---------- 3. requests.service.ts ----------
path3 = "src/modules/requests/requests.service.ts"
c3 = leer(path3)
if "preorder_date_mode" in c3:
    print("YA ESTABA: requests.service.ts ya tiene preorder_date_mode")
else:
    old_create_svc = """            const request = await tx.requests.create({
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_folio,
                    vc_name: data.vc_name,
                    f_value,
                    url_rack_image: data.url_rack_image,
                    b_preorder: data.b_preorder ?? false,
                }
            })"""
    new_create_svc = """            const request = await tx.requests.create({
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_folio,
                    vc_name: data.vc_name,
                    f_value,
                    url_rack_image: data.url_rack_image,
                    b_preorder: data.b_preorder ?? false,
                    preorder_date_mode: data.preorder_date_mode ?? 'ABIERTA',
                }
            })"""
    assert c3.count(old_create_svc) == 1, "No encontre el create esperado en requests.service.ts"
    c3 = c3.replace(old_create_svc, new_create_svc)

    old_update_svc = """            const request = await tx.requests.update({
                where: { id_request },
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_name: data.vc_name,
                    f_value,
                    url_rack_image: data.url_rack_image,
                    id_status: data.id_status,
                    b_preorder: data.b_preorder,
                    dt_update: new Date(),
                }
            })"""
    new_update_svc = """            const request = await tx.requests.update({
                where: { id_request },
                data: {
                    id_user: data.id_user,
                    id_client: data.id_client,
                    vc_name: data.vc_name,
                    f_value,
                    url_rack_image: data.url_rack_image,
                    id_status: data.id_status,
                    b_preorder: data.b_preorder,
                    preorder_date_mode: data.preorder_date_mode,
                    dt_update: new Date(),
                }
            })"""
    assert c3.count(old_update_svc) == 1, "No encontre el update esperado en requests.service.ts"
    c3 = c3.replace(old_update_svc, new_update_svc)

    escribir(path3, c3)
    print("OK: requests.service.ts actualizado")
    cambios += 1

print(f"TOTAL cambios aplicados: {cambios}")

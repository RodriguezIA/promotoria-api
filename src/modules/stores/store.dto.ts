import { CreateAddressDTO } from '../address/address.dto'

export interface CreateStoreDTO {
  id_user: number
  name: string
  store_code?: string
  address: CreateAddressDTO
}
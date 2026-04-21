export interface CreateAddressDTO {
  entity_type: string
  entity_id: number
  id_country: number
  id_state: number
  id_city: number
  street: string
  ext_number: string
  int_number?: string
  neighborhood?: string
  postal_code: string
  address_references?: string
  latitude?: string
  longitude?: string
}
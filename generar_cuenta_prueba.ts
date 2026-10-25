import 'dotenv/config'
import { EncryptionService } from './src/services/encryption.service'

const clabeEncriptada = EncryptionService.encrypt('012180012345678901')
console.log(clabeEncriptada)

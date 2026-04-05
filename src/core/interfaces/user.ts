export interface IUser {
  id_user: number;
  id_client: number;
  email: string;
  password: string;
  name: string;
  lastname: string;
  i_rol: number;
  i_status: boolean;
  dt_register: string;
  dt_updated: string;
  reset_password_token?: string;
  reset_password_expires?: Date;
}

export interface IUserLog {
  id_user_log: number;
  id_user: number;
  log: string;
  i_status: boolean;
  dt_register: string;
  dt_updated: string;
}

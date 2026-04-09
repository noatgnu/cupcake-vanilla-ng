export interface ExcelLaunchRequest {
  tableId: number;
  tableName?: string;
}

export interface ExcelLaunchCode {
  code: string;
  tableId: number;
  tableName?: string;
  expiresIn: number;
}

export interface ExcelLaunchClaimRequest {
  code: string;
}

export interface ExcelLaunchClaimResponse {
  accessToken: string;
  refreshToken: string;
  tableId: number;
  tableName?: string;
  user: {
    id: number;
    username: string;
    email: string;
  };
}

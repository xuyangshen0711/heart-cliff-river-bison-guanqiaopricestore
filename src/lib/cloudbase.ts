/** Server-only CloudBase PostgreSQL client. */

type CloudBaseResponse<T> = {
  data: T | null;
  error: { message?: string; code?: string } | null;
};

export interface CloudBaseQuery {
  from(table: string): any;
}

const envId = process.env.CLOUDBASE_ENV_ID?.trim();
const secretId =
  process.env.TENCENTCLOUD_SECRETID?.trim() || process.env.CLOUDBASE_SECRET_ID?.trim();
const secretKey =
  process.env.TENCENTCLOUD_SECRETKEY?.trim() || process.env.CLOUDBASE_SECRET_KEY?.trim();

export const cloudBaseConfigured = Boolean(
  envId && ((secretId && secretKey) || process.env.CLOUDBASE_APIKEY?.trim()),
);

let clientPromise: Promise<CloudBaseQuery> | undefined;

export function getCloudBase(): Promise<CloudBaseQuery> {
  if (typeof window !== "undefined") {
    throw new Error("CloudBase 凭据只能在网站后端使用");
  }
  if (!cloudBaseConfigured || !envId) {
    throw new Error("CloudBase 环境变量尚未完整配置");
  }

  clientPromise ??= import("@cloudbase/js-sdk").then(({ default: cloudbase }) => {
    const app = cloudbase.init({
      env: envId,
      region: process.env.CLOUDBASE_REGION?.trim() || "ap-shanghai",
      ...(secretId && secretKey ? { secretId, secretKey } : {}),
    });
    return app.rdb() as unknown as CloudBaseQuery;
  });
  return clientPromise;
}

export function cloudBaseData<T>(response: CloudBaseResponse<T>, action: string): T {
  if (response.error) {
    const detail = response.error.message || response.error.code || "未知错误";
    throw new Error(`腾讯云数据库${action}失败：${detail}`);
  }
  return response.data as T;
}

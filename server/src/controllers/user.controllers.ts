import { OpenAPIHono } from "@hono/zod-openapi";
import { getUserRoute } from "../schema/user.schema";

export const userController = new OpenAPIHono();

// ผูก Handler เข้ากับ Route Spec
userController.openapi(getUserRoute, (c) => {
  const { id } = c.req.valid("param");

  // Mock ข้อมูลสำหรับส่งกลับ (ในอนาคตส่วนนี้จะไปดึงมาจาก service/repository)
  return c.json(
    {
      id,
      name: "John Doe",
      age: 25,
    },
    200,
  );
});

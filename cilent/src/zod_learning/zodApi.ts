import { z } from "zod";

const getUsersSchema = z.object({
  limit: z.number(),
  offset: z.number(),
});

type UserFilters = z.infer<typeof getUsersSchema>;

export async function getUsers(filters: UserFilters) {
  // Use the filters

  console.log(getUsersSchema.safeParse(filters));

  //
}

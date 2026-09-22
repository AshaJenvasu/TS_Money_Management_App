import { z } from "zod";

const userSchema = z.object({
  //pass any object into it as data
  firstName: z.string().optional(),
  email: z.string().email(),
  profileUrl: z.string().url(),
  age: z.number().min(1),
  friends: z.array(z.string()).max(3),
  settings: z.object({
    isSubscribed: z.boolean(),
  }),
  //then will check whether object has the firstNmae Property and that we are passing a string as a firstName Property
});

type User = z.infer<typeof userSchema>;
//automatically inferred from the schema

const user: User = {
  firstName: "Asha",
  email: "asha@me.com",
  profileUrl: "https://ashame.com",
  age: 18,
  friends: ["Kota", "Heesoo"],
  settings: {
    isSubscribed: true,
  },
};

console.log(userSchema.safeParse(user));

export default function App() {
  return (
    <div>
      <h1 className="text-2xl font-bold">Asha</h1>
    </div>
  );
}

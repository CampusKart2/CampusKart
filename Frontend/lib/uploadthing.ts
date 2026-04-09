import { createUploadthing } from "uploadthing/server";

const f = createUploadthing();

export const ourFileRouter = {
  photo: f({
    image: {
      maxFileSize: "4MB",
    },
  }).onUploadComplete(() => undefined),
} as const;

export type OurFileRouter = typeof ourFileRouter;

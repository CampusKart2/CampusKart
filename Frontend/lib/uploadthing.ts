import { createUploadthing, UploadThingError } from "uploadthing/server";

const LISTING_PHOTO_MAX_FILE_COUNT = 5;
const LISTING_PHOTO_MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const AVATAR_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const UPLOADTHING_IMAGE_SIZE_CEILING = "8MB" as const;
const UPLOADTHING_AVATAR_SIZE_CEILING = "4MB" as const;

type UploadThingErrorShape = {
  code: UploadThingError["code"];
  message: string;
};

const f = createUploadthing<UploadThingErrorShape>({
  errorFormatter: (error) => {
    const cause =
      typeof error.cause === "string" && error.cause.trim().length > 0
        ? error.cause
        : undefined;

    // UploadThing already validates file size/count before upload. We remap its
    // internal mismatch errors to clearer product-facing copy for CampusKart.
    if (cause?.includes("but the maximum for that type is")) {
      return {
        code: error.code,
        message: `You can upload up to ${LISTING_PHOTO_MAX_FILE_COUNT} listing photos at a time.`,
      };
    }

    if (cause?.includes("but the limit for that type is")) {
      return {
        code: error.code,
        message: "Each listing photo must be 5 MB or smaller.",
      };
    }

    return {
      code: error.code,
      message: cause ?? error.message,
    };
  },
});

export const ourFileRouter = {
  avatar: f({
    image: {
      maxFileCount: 1,
      maxFileSize: UPLOADTHING_AVATAR_SIZE_CEILING,
    },
  })
    .middleware(({ files }) => {
      const oversizedFile = files.find(
        (file) => file.size > AVATAR_MAX_FILE_SIZE_BYTES
      );

      if (oversizedFile) {
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: `Profile photos must be 2 MB or smaller. "${oversizedFile.name}" is too large.`,
        });
      }

      return {};
    })
    .onUploadComplete(() => undefined),
  photo: f({
    image: {
      maxFileCount: LISTING_PHOTO_MAX_FILE_COUNT,
      maxFileSize: UPLOADTHING_IMAGE_SIZE_CEILING,
    },
  })
    .middleware(({ files }) => {
      const oversizedFile = files.find(
        (file) => file.size > LISTING_PHOTO_MAX_FILE_SIZE_BYTES
      );

      if (oversizedFile) {
        throw new UploadThingError({
          code: "BAD_REQUEST",
          message: `Each listing photo must be 5 MB or smaller. "${oversizedFile.name}" is too large.`,
        });
      }

      return {};
    })
    .onUploadComplete(() => undefined),
} as const;

export type OurFileRouter = typeof ourFileRouter;

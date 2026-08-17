import { createUploadthing, type FileRouter } from "uploadthing/next-legacy"

const f = createUploadthing()

export const ourFileRouter = {
  // Course cover image uploader
  courseImage: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name, size: file.size }
    }),

  // Lecture resources: PDFs, Diagrams, Documents
  lectureResource: f({
    pdf: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
    image: {
      maxFileSize: "16MB",
      maxFileCount: 1,
    },
    blob: {
      maxFileSize: "32MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      return {}
    })
    .onUploadComplete(async ({ file }) => {
      return { url: file.url, name: file.name, size: file.size }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter

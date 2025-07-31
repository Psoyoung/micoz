-- CreateTable
CREATE TABLE "review_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reviewId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "review_comments_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "reviews" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "review_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "review_comments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

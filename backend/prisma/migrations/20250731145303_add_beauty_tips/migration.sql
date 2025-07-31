-- CreateTable
CREATE TABLE "beauty_tips" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "tags" TEXT,
    "images" TEXT,
    "skinTypes" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'BEGINNER',
    "views" INTEGER NOT NULL DEFAULT 0,
    "upvotes" INTEGER NOT NULL DEFAULT 0,
    "downvotes" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "beauty_tips_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "beauty_tip_votes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "isUpvote" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "beauty_tip_votes_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "beauty_tips" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "beauty_tip_votes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "beauty_tip_comments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "beauty_tip_comments_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "beauty_tips" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "beauty_tip_comments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "beauty_tip_comments_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "beauty_tip_comments" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "beauty_tip_follows" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "beauty_tip_follows_tipId_fkey" FOREIGN KEY ("tipId") REFERENCES "beauty_tips" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "beauty_tip_follows_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "beauty_tip_votes_tipId_userId_key" ON "beauty_tip_votes"("tipId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "beauty_tip_follows_tipId_userId_key" ON "beauty_tip_follows"("tipId", "userId");

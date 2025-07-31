import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { productId, title, content, category } = req.body;
    const userId = req.user.userId;

    // Validate required fields
    if (!productId || !title || !content) {
      return res.status(400).json({ 
        error: 'Product ID, title, and content are required',
        code: 'MISSING_REQUIRED_FIELDS'
      });
    }

    // Check if product exists
    const product = await prisma.product.findUnique({
      where: { id: productId, status: 'ACTIVE' },
    });

    if (!product) {
      return res.status(404).json({ 
        error: 'Product not found',
        code: 'PRODUCT_NOT_FOUND'
      });
    }

    // Create question
    const question = await prisma.question.create({
      data: {
        userId,
        productId,
        title,
        content,
        category: category || 'GENERAL'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            answers: true,
          }
        }
      }
    });

    res.status(201).json({
      message: 'Question created successfully',
      question: {
        id: question.id,
        title: question.title,
        content: question.content,
        category: question.category,
        status: question.status,
        upvotes: question.upvotes,
        downvotes: question.downvotes,
        isAnswered: question.isAnswered,
        createdAt: question.createdAt,
        user: {
          name: `${question.user.lastName}${question.user.firstName.charAt(0)}*`,
          avatar: question.user.avatar,
        },
        product: question.product,
        answerCount: question._count.answers
      }
    });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ 
      error: 'Failed to create question',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const updateQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { questionId } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.userId;

    // Find existing question
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion) {
      return res.status(404).json({ 
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    }

    if (existingQuestion.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only edit your own questions',
        code: 'FORBIDDEN'
      });
    }

    // Update question
    const updatedQuestion = await prisma.question.update({
      where: { id: questionId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        },
        product: {
          select: {
            id: true,
            name: true,
            slug: true,
          }
        },
        _count: {
          select: {
            answers: true,
          }
        }
      }
    });

    res.json({
      message: 'Question updated successfully',
      question: {
        id: updatedQuestion.id,
        title: updatedQuestion.title,
        content: updatedQuestion.content,
        category: updatedQuestion.category,
        status: updatedQuestion.status,
        upvotes: updatedQuestion.upvotes,
        downvotes: updatedQuestion.downvotes,
        isAnswered: updatedQuestion.isAnswered,
        createdAt: updatedQuestion.createdAt,
        updatedAt: updatedQuestion.updatedAt,
        user: {
          name: `${updatedQuestion.user.lastName}${updatedQuestion.user.firstName.charAt(0)}*`,
          avatar: updatedQuestion.user.avatar,
        },
        product: updatedQuestion.product,
        answerCount: updatedQuestion._count.answers
      }
    });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ 
      error: 'Failed to update question',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { questionId } = req.params;
    const userId = req.user.userId;

    // Find existing question
    const existingQuestion = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!existingQuestion) {
      return res.status(404).json({ 
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    }

    if (existingQuestion.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own questions',
        code: 'FORBIDDEN'
      });
    }

    // Delete question (cascades to answers and votes)
    await prisma.question.delete({
      where: { id: questionId }
    });

    res.json({
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ 
      error: 'Failed to delete question',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const createAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { questionId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!content) {
      return res.status(400).json({ 
        error: 'Content is required',
        code: 'MISSING_CONTENT'
      });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ 
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    }

    // Check if user has staff role (you might want to add a role field to User model)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // For now, assume all users can answer, but mark staff answers differently
    // You would implement proper role checking here
    const isOfficial = user?.email?.endsWith('@micoz.com') || false;

    // Create answer
    const answer = await prisma.answer.create({
      data: {
        questionId,
        userId,
        content,
        isOfficial
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    // Update question answered status
    await prisma.question.update({
      where: { id: questionId },
      data: { isAnswered: true }
    });

    res.status(201).json({
      message: 'Answer created successfully',
      answer: {
        id: answer.id,
        content: answer.content,
        isOfficial: answer.isOfficial,
        isAccepted: answer.isAccepted,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        createdAt: answer.createdAt,
        user: {
          name: answer.isOfficial 
            ? 'MICOZ 고객센터' 
            : `${answer.user.lastName}${answer.user.firstName.charAt(0)}*`,
          avatar: answer.user.avatar,
          isOfficial: answer.isOfficial
        }
      }
    });
  } catch (error) {
    console.error('Create answer error:', error);
    res.status(500).json({ 
      error: 'Failed to create answer',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const updateAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { answerId } = req.params;
    const { content, isAccepted } = req.body;
    const userId = req.user.userId;

    // Find existing answer
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        question: true
      }
    });

    if (!existingAnswer) {
      return res.status(404).json({ 
        error: 'Answer not found',
        code: 'ANSWER_NOT_FOUND'
      });
    }

    // Check permissions
    const canEdit = existingAnswer.userId === userId || 
                   existingAnswer.question.userId === userId; // Question author can accept answers

    if (!canEdit) {
      return res.status(403).json({ 
        error: 'You can only edit your own answers or accept answers to your questions',
        code: 'FORBIDDEN'
      });
    }

    // If accepting an answer, unaccept all other answers first
    if (isAccepted && existingAnswer.question.userId === userId) {
      await prisma.answer.updateMany({
        where: { 
          questionId: existingAnswer.questionId,
          isAccepted: true
        },
        data: { isAccepted: false }
      });
    }

    // Update answer
    const updatedAnswer = await prisma.answer.update({
      where: { id: answerId },
      data: {
        ...(content && existingAnswer.userId === userId && { content }),
        ...(isAccepted !== undefined && existingAnswer.question.userId === userId && { isAccepted }),
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          }
        }
      }
    });

    res.json({
      message: 'Answer updated successfully',
      answer: {
        id: updatedAnswer.id,
        content: updatedAnswer.content,
        isOfficial: updatedAnswer.isOfficial,
        isAccepted: updatedAnswer.isAccepted,
        upvotes: updatedAnswer.upvotes,
        downvotes: updatedAnswer.downvotes,
        createdAt: updatedAnswer.createdAt,
        updatedAt: updatedAnswer.updatedAt,
        user: {
          name: updatedAnswer.isOfficial 
            ? 'MICOZ 고객센터' 
            : `${updatedAnswer.user.lastName}${updatedAnswer.user.firstName.charAt(0)}*`,
          avatar: updatedAnswer.user.avatar,
          isOfficial: updatedAnswer.isOfficial
        }
      }
    });
  } catch (error) {
    console.error('Update answer error:', error);
    res.status(500).json({ 
      error: 'Failed to update answer',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { answerId } = req.params;
    const userId = req.user.userId;

    // Find existing answer
    const existingAnswer = await prisma.answer.findUnique({
      where: { id: answerId }
    });

    if (!existingAnswer) {
      return res.status(404).json({ 
        error: 'Answer not found',
        code: 'ANSWER_NOT_FOUND'
      });
    }

    if (existingAnswer.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own answers',
        code: 'FORBIDDEN'
      });
    }

    // Delete answer
    await prisma.answer.delete({
      where: { id: answerId }
    });

    // Check if question still has answers, update isAnswered status
    const remainingAnswers = await prisma.answer.count({
      where: { questionId: existingAnswer.questionId }
    });

    if (remainingAnswers === 0) {
      await prisma.question.update({
        where: { id: existingAnswer.questionId },
        data: { isAnswered: false }
      });
    }

    res.json({
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    console.error('Delete answer error:', error);
    res.status(500).json({ 
      error: 'Failed to delete answer',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const voteQuestion = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { questionId } = req.params;
    const { isUpvote } = req.body;
    const userId = req.user.userId;

    if (typeof isUpvote !== 'boolean') {
      return res.status(400).json({ 
        error: 'isUpvote must be a boolean',
        code: 'INVALID_VOTE'
      });
    }

    // Check if question exists
    const question = await prisma.question.findUnique({
      where: { id: questionId }
    });

    if (!question) {
      return res.status(404).json({ 
        error: 'Question not found',
        code: 'QUESTION_NOT_FOUND'
      });
    }

    // Prevent users from voting on their own questions
    if (question.userId === userId) {
      return res.status(400).json({ 
        error: 'You cannot vote on your own question',
        code: 'CANNOT_VOTE_OWN_QUESTION'
      });
    }

    // Upsert vote
    const vote = await prisma.questionVote.upsert({
      where: {
        questionId_userId: {
          questionId,
          userId
        }
      },
      update: {
        isUpvote
      },
      create: {
        questionId,
        userId,
        isUpvote
      }
    });

    // Update vote counts on question
    const [upvoteCount, downvoteCount] = await Promise.all([
      prisma.questionVote.count({
        where: { questionId, isUpvote: true }
      }),
      prisma.questionVote.count({
        where: { questionId, isUpvote: false }
      })
    ]);

    await prisma.question.update({
      where: { id: questionId },
      data: { 
        upvotes: upvoteCount,
        downvotes: downvoteCount
      }
    });

    res.json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        isUpvote: vote.isUpvote,
        createdAt: vote.createdAt
      },
      upvotes: upvoteCount,
      downvotes: downvoteCount
    });
  } catch (error) {
    console.error('Vote question error:', error);
    res.status(500).json({ 
      error: 'Failed to record vote',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const voteAnswer = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { answerId } = req.params;
    const { isUpvote } = req.body;
    const userId = req.user.userId;

    if (typeof isUpvote !== 'boolean') {
      return res.status(400).json({ 
        error: 'isUpvote must be a boolean',
        code: 'INVALID_VOTE'
      });
    }

    // Check if answer exists
    const answer = await prisma.answer.findUnique({
      where: { id: answerId }
    });

    if (!answer) {
      return res.status(404).json({ 
        error: 'Answer not found',
        code: 'ANSWER_NOT_FOUND'
      });
    }

    // Prevent users from voting on their own answers
    if (answer.userId === userId) {
      return res.status(400).json({ 
        error: 'You cannot vote on your own answer',
        code: 'CANNOT_VOTE_OWN_ANSWER'
      });
    }

    // Upsert vote
    const vote = await prisma.answerVote.upsert({
      where: {
        answerId_userId: {
          answerId,
          userId
        }
      },
      update: {
        isUpvote
      },
      create: {
        answerId,
        userId,
        isUpvote
      }
    });

    // Update vote counts on answer
    const [upvoteCount, downvoteCount] = await Promise.all([
      prisma.answerVote.count({
        where: { answerId, isUpvote: true }
      }),
      prisma.answerVote.count({
        where: { answerId, isUpvote: false }
      })
    ]);

    await prisma.answer.update({
      where: { id: answerId },
      data: { 
        upvotes: upvoteCount,
        downvotes: downvoteCount
      }
    });

    res.json({
      message: 'Vote recorded successfully',
      vote: {
        id: vote.id,
        isUpvote: vote.isUpvote,
        createdAt: vote.createdAt
      },
      upvotes: upvoteCount,
      downvotes: downvoteCount
    });
  } catch (error) {
    console.error('Vote answer error:', error);
    res.status(500).json({ 
      error: 'Failed to record vote',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getQuestionsByProduct = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      category,
      status,
      answered
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = { productId };

    if (category) {
      where.category = category;
    }

    if (status) {
      where.status = status;
    }

    if (answered === 'true') {
      where.isAnswered = true;
    } else if (answered === 'false') {
      where.isAnswered = false;
    }

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'upvotes') {
      orderBy.upvotes = sortOrder;
    } else if (sortBy === 'answers') {
      orderBy.answers = { _count: sortOrder };
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where,
        orderBy,
        skip,
        take: limitNumber,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          },
          answers: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            },
            orderBy: [
              { isAccepted: 'desc' },
              { isOfficial: 'desc' },
              { upvotes: 'desc' }
            ]
          },
          _count: {
            select: {
              answers: true,
            }
          }
        }
      }),
      prisma.question.count({ where })
    ]);

    // Format questions
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      content: question.content,
      category: question.category,
      status: question.status,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      isAnswered: question.isAnswered,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      user: {
        name: `${question.user.lastName}${question.user.firstName.charAt(0)}*`,
        avatar: question.user.avatar,
      },
      answerCount: question._count.answers,
      answers: question.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        isOfficial: answer.isOfficial,
        isAccepted: answer.isAccepted,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        user: {
          name: answer.isOfficial 
            ? 'MICOZ 고객센터' 
            : `${answer.user.lastName}${answer.user.firstName.charAt(0)}*`,
          avatar: answer.user.avatar,
          isOfficial: answer.isOfficial
        }
      }))
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      questions: formattedQuestions,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get questions by product error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch questions',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getMyQuestions = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build orderBy clause
    const orderBy: any = {};
    if (sortBy === 'upvotes') {
      orderBy.upvotes = sortOrder;
    } else {
      orderBy.createdAt = sortOrder;
    }

    // Execute queries
    const [questions, totalCount] = await Promise.all([
      prisma.question.findMany({
        where: { userId },
        orderBy,
        skip,
        take: limitNumber,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              slug: true,
              images: true,
            }
          },
          answers: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  avatar: true,
                }
              }
            },
            orderBy: [
              { isAccepted: 'desc' },
              { isOfficial: 'desc' },
              { upvotes: 'desc' }
            ]
          },
          _count: {
            select: {
              answers: true,
            }
          }
        }
      }),
      prisma.question.count({ where: { userId } })
    ]);

    // Format questions
    const formattedQuestions = questions.map(question => ({
      id: question.id,
      title: question.title,
      content: question.content,
      category: question.category,
      status: question.status,
      upvotes: question.upvotes,
      downvotes: question.downvotes,
      isAnswered: question.isAnswered,
      createdAt: question.createdAt,
      updatedAt: question.updatedAt,
      product: {
        id: question.product.id,
        name: question.product.name,
        slug: question.product.slug,
        images: question.product.images ? JSON.parse(question.product.images) : [],
      },
      answerCount: question._count.answers,
      answers: question.answers.map(answer => ({
        id: answer.id,
        content: answer.content,
        isOfficial: answer.isOfficial,
        isAccepted: answer.isAccepted,
        upvotes: answer.upvotes,
        downvotes: answer.downvotes,
        createdAt: answer.createdAt,
        updatedAt: answer.updatedAt,
        user: {
          name: answer.isOfficial 
            ? 'MICOZ 고객센터' 
            : `${answer.user.lastName}${answer.user.firstName.charAt(0)}*`,
          avatar: answer.user.avatar,
          isOfficial: answer.isOfficial
        }
      }))
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      questions: formattedQuestions,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalCount,
        limit: limitNumber,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1,
      }
    });
  } catch (error) {
    console.error('Get my questions error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch your questions',
      code: 'INTERNAL_ERROR'
    });
  }
};
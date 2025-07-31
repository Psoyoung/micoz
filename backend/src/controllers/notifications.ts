import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthenticatedRequest } from '../middleware/auth';

const prisma = new PrismaClient();

// Notification creation helper
export const createNotification = async (
  userId: string,
  senderId: string | null,
  type: string,
  title: string,
  message: string,
  data?: any
) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        senderId,
        type: type as any,
        title,
        message,
        data: data ? JSON.stringify(data) : null
      }
    });
  } catch (error) {
    console.error('Failed to create notification:', error);
  }
};

export const getNotifications = async (req: AuthenticatedRequest, res: Response) => {
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
      limit = 20,
      type,
      read
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page as string));
    const limitNumber = Math.min(50, Math.max(1, parseInt(limit as string)));
    const skip = (pageNumber - 1) * limitNumber;

    // Build where clause
    const where: any = { userId };
    
    if (type) {
      where.type = type;
    }
    
    if (read === 'true') {
      where.read = true;
    } else if (read === 'false') {
      where.read = false;
    }

    // Execute queries
    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNumber,
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatar: true,
            }
          }
        }
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ 
        where: { userId, read: false } 
      })
    ]);

    // Format notifications
    const formattedNotifications = notifications.map(notification => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      data: notification.data ? JSON.parse(notification.data) : null,
      read: notification.read,
      readAt: notification.readAt,
      createdAt: notification.createdAt,
      sender: notification.sender ? {
        name: `${notification.sender.lastName}${notification.sender.firstName.charAt(0)}*`,
        avatar: notification.sender.avatar,
      } : null
    }));

    const totalPages = Math.ceil(totalCount / limitNumber);

    res.json({
      notifications: formattedNotifications,
      unreadCount,
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
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch notifications',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ 
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only mark your own notifications as read',
        code: 'FORBIDDEN'
      });
    }

    // Mark as read
    await prisma.notification.update({
      where: { id: notificationId },
      data: { 
        read: true,
        readAt: new Date()
      }
    });

    res.json({
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark notification as read',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: { 
        userId,
        read: false
      },
      data: { 
        read: true,
        readAt: new Date()
      }
    });

    res.json({
      message: 'All notifications marked as read',
      count: result.count
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      error: 'Failed to mark all notifications as read',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const { notificationId } = req.params;
    const userId = req.user.userId;

    // Find notification
    const notification = await prisma.notification.findUnique({
      where: { id: notificationId }
    });

    if (!notification) {
      return res.status(404).json({ 
        error: 'Notification not found',
        code: 'NOTIFICATION_NOT_FOUND'
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ 
        error: 'You can only delete your own notifications',
        code: 'FORBIDDEN'
      });
    }

    // Delete notification
    await prisma.notification.delete({
      where: { id: notificationId }
    });

    res.json({
      message: 'Notification deleted'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      error: 'Failed to delete notification',
      code: 'INTERNAL_ERROR'
    });
  }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const userId = req.user.userId;

    const unreadCount = await prisma.notification.count({
      where: { 
        userId,
        read: false
      }
    });

    res.json({
      unreadCount
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      error: 'Failed to get unread count',
      code: 'INTERNAL_ERROR'
    });
  }
};

// Notification trigger functions (to be called from other controllers)
export const notifyReviewComment = async (reviewId: string, commenterId: string) => {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: { select: { id: true, firstName: true } },
        product: { select: { name: true } }
      }
    });

    if (review && review.userId !== commenterId) {
      await createNotification(
        review.userId,
        commenterId,
        'REVIEW_COMMENT',
        '리뷰에 새 댓글이 달렸습니다',
        `${review.product.name} 리뷰에 새로운 댓글이 달렸습니다.`,
        { reviewId, productName: review.product.name }
      );
    }
  } catch (error) {
    console.error('Failed to create review comment notification:', error);
  }
};

export const notifyQuestionAnswered = async (questionId: string, answererId: string) => {
  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      include: {
        user: { select: { id: true, firstName: true } },
        product: { select: { name: true } }
      }
    });

    if (question && question.userId !== answererId) {
      await createNotification(
        question.userId,
        answererId,
        'QUESTION_ANSWERED',
        '질문에 답변이 달렸습니다',
        `${question.product.name}에 대한 질문에 새로운 답변이 달렸습니다.`,
        { questionId, productName: question.product.name }
      );
    }
  } catch (error) {
    console.error('Failed to create question answered notification:', error);
  }
};

export const notifyAnswerAccepted = async (answerId: string) => {
  try {
    const answer = await prisma.answer.findUnique({
      where: { id: answerId },
      include: {
        user: { select: { id: true, firstName: true } },
        question: {
          include: {
            product: { select: { name: true } }
          }
        }
      }
    });

    if (answer) {
      await createNotification(
        answer.userId,
        answer.question.userId,
        'ANSWER_ACCEPTED',
        '답변이 채택되었습니다',
        `${answer.question.product.name}에 대한 답변이 채택되었습니다.`,
        { answerId, questionId: answer.questionId, productName: answer.question.product.name }
      );
    }
  } catch (error) {
    console.error('Failed to create answer accepted notification:', error);
  }
};

export const notifyTipComment = async (tipId: string, commenterId: string) => {
  try {
    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId },
      include: {
        user: { select: { id: true, firstName: true } }
      }
    });

    if (tip && tip.userId !== commenterId) {
      await createNotification(
        tip.userId,
        commenterId,
        'TIP_COMMENT',
        '뷰티 팁에 새 댓글이 달렸습니다',
        `"${tip.title}" 뷰티 팁에 새로운 댓글이 달렸습니다.`,
        { tipId, tipTitle: tip.title }
      );
    }
  } catch (error) {
    console.error('Failed to create tip comment notification:', error);
  }
};

export const notifyTipFeatured = async (tipId: string) => {
  try {
    const tip = await prisma.beautyTip.findUnique({
      where: { id: tipId },
      include: {
        user: { select: { id: true, firstName: true } }
      }
    });

    if (tip) {
      await createNotification(
        tip.userId,
        null, // System notification
        'TIP_FEATURED',
        '뷰티 팁이 추천되었습니다!',
        `축하합니다! "${tip.title}" 뷰티 팁이 추천 팁으로 선정되었습니다.`,
        { tipId, tipTitle: tip.title }
      );
    }
  } catch (error) {
    console.error('Failed to create tip featured notification:', error);
  }
};
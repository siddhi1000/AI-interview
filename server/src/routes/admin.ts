// // src/routes/admin.ts
// import { Router } from "express";
// import { prisma } from "../db/prisma";
// import { attachDbUser, requireAdmin } from "../middleware/auth"; // ← IMPORT HERE!

// export const adminRouter = Router();

// // Protect all admin routes with auth + admin check
// adminRouter.use(attachDbUser, requireAdmin);

// // GET /api/admin/candidates
// adminRouter.get("/candidates", async (req, res) => {
//   try {
//     const q = typeof req.query.q === "string" ? req.query.q.trim().toLowerCase() : "";
//     const take = Math.min(500, Math.max(1, Number(req.query.take ?? 25)));
//     const skip = Math.max(0, Number(req.query.skip ?? 0));

//     console.log(`[Admin Candidates] Query: "${q}", skip=${skip}, take=${take}, user: ${(req as any).dbUser?.email}`);

//     const users = await prisma.user.findMany({
//       where: q
//         ? {
//             OR: [
//               { email: { contains: q, mode: "insensitive" } },
//               { profile: { firstName: { contains: q, mode: "insensitive" } } },
//               { profile: { lastName: { contains: q, mode: "insensitive" } } },
//             ],
//           }
//         : undefined,
//       orderBy: { createdAt: "desc" },
//       take,
//       skip,
//       include: {
//         profile: true,
//         interviews: {
//           where: { status: "COMPLETED" },
//           include: { feedback: true },
//         },
//       },
//     });

//     const candidates = users.map((u) => {
//       const completed = u.interviews.length;
//       const scores = u.interviews
//         .map((i) => i.feedback?.overallScore)
//         .filter((s): s is number => typeof s === "number");

//       const avgScore = scores.length
//         ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
//         : null;

//       return {
//         id: u.id,
//         email: u.email,
//         role: u.role,
//         name: [u.profile?.firstName, u.profile?.lastName].filter(Boolean).join(" ") || null,
//         interviewsCompleted: completed,
//         avgScore,
//         createdAt: u.createdAt.toISOString(),
//       };
//     });

//     res.json({ candidates });
//   } catch (err: any) {
//     console.error("[/admin/candidates] Error:", {
//       message: err.message,
//       stack: err.stack?.slice(0, 300),
//       clerkError: err.clerkError,
//       errors: err.errors,
//     });

//     const status = err.clerkError ? 401 : err instanceof HttpError ? err.status : 500;
//     res.status(status).json({
//       error: status === 401 ? "Authentication failed" : "Internal server error",
//       message: process.env.NODE_ENV === "development" ? err.message : undefined,
//     });
//   }
// });

// // GET /api/admin/interviews
// adminRouter.get("/interviews", async (req, res) => {
//   try {
//     const status = typeof req.query.status === "string" ? req.query.status : undefined;
//     const interviews = await prisma.interview.findMany({
//       where: status ? { status: status as any } : undefined,
//       orderBy: { createdAt: "desc" },
//       include: {
//         user: { select: { id: true, email: true, role: true } },
//         jobRole: { select: { id: true, title: true, category: true } },
//         feedback: true,
//       },
//       take: 200,
//     });
//     res.json({ interviews });
//   } catch (err) {
//     console.error("[/admin/interviews] Error:", err);
//     res.status(500).json({ error: "Failed to fetch interviews" });
//   }
// });

// // DELETE /api/admin/interviews/:id
// adminRouter.delete("/interviews/:id", async (req, res) => {
//   try {
//     const { id } = req.params;

//     const interview = await prisma.interview.findUnique({ where: { id } });

//     if (!interview) {
//       return res.status(404).json({ error: "Interview not found" });
//     }

//     await prisma.$transaction([
//       prisma.interviewFeedback.deleteMany({ where: { interviewId: id } }),
//       prisma.interviewAssessment.deleteMany({ where: { interviewId: id } }),
//       prisma.interviewAnswer.deleteMany({ where: { interviewId: id } }),
//       prisma.interviewQuestion.deleteMany({ where: { interviewId: id } }),
//       prisma.interviewEvent.deleteMany({ where: { interviewId: id } }),
//       prisma.interviewDocument.deleteMany({ where: { interviewId: id } }),
//       prisma.interview.delete({ where: { id } }),
//     ]);

//     res.status(200).json({ success: true, message: "Interview deleted" });
//   } catch (err) {
//     console.error("[DELETE /admin/interviews/:id] Error:", err);
//     res.status(500).json({ error: "Failed to delete interview" });
//   }
// });
import { Router } from "express";
import { prisma } from "../db/prisma";
import { attachDbUser, requireAdmin } from "../middleware/auth";

export const adminRouter = Router();

// Protect all admin routes with auth + admin check
adminRouter.use(attachDbUser, requireAdmin);

// GET /api/admin/stats
adminRouter.get("/stats", async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [totalUsers, interviewsToday, avgPerformance, activeUsers, pendingReviews] = await Promise.all([
      prisma.user.count({ where: { role: 'CANDIDATE' } }),
      prisma.interview.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow
          }
        }
      }),
      prisma.interview.aggregate({
        where: {
          score: { not: null }
        },
        _avg: {
          score: true
        }
      }),
      prisma.user.count({
        where: {
          role: 'CANDIDATE',
          lastActive: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // Last 30 days
          }
        }
      }),
      prisma.interview.count({
        where: {
          status: 'PENDING_REVIEW'
        }
      })
    ]);

    res.json({
      totalUsers,
      interviewsToday,
      avgPerformance: Math.round(avgPerformance._avg.score || 0),
      activeUsers,
      pendingReviews
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/admin/candidates
adminRouter.get("/candidates", async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    const page = Math.max(1, Number(req.query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(req.query.limit ?? 10)));
    const skip = (page - 1) * limit;
    const take = limit;

    console.log(`[Admin Candidates] Query: "${q}", page=${page}, limit=${limit}, skip=${skip}`);

    // Build where clause
    const where: any = {
      role: 'CANDIDATE'
    };

    // Search query
    if (q) {
      where.OR = [
        { email: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take,
        skip,
        include: {
          profile: true,
          interviews: {
            where: { 
              status: "COMPLETED"
            },
            select: {
              id: true,
              score: true,
              completedAt: true,
              createdAt: true
            },
          },
        },
      }),
      prisma.user.count({ where })
    ]);

    console.log(`[Admin Candidates] Found ${users.length} users out of ${total} total`);

    const candidates = users.map((u) => {
      // Get completed interviews with scores
      const completedInterviews = u.interviews.filter(i => i.score !== null);
      
      // Calculate average score
      const scores = completedInterviews
        .map((i) => i.score)
        .filter((s): s is number => s !== null);
      
      const avgScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      // Get last active date
      let lastActive = u.lastActive || u.createdAt;
      if (completedInterviews.length > 0) {
        const latestInterview = [...completedInterviews].sort((a, b) => {
          const dateA = a.completedAt || a.createdAt;
          const dateB = b.completedAt || b.createdAt;
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })[0];
        lastActive = latestInterview.completedAt || latestInterview.createdAt || lastActive;
      }

      // Get name from various sources
      const name = u.name || 
                  (u.profile?.firstName && u.profile?.lastName ? 
                    `${u.profile.firstName} ${u.profile.lastName}` : 
                    u.profile?.firstName || 
                    u.profile?.lastName || 
                    u.email.split('@')[0]);

      return {
        id: u.id,
        email: u.email,
        name: name,
        role: u.role,
        status: u.status?.toLowerCase() || 'active',
        skills: u.skills || [],
        interviewsCompleted: completedInterviews.length,
        avgScore: avgScore,
        createdAt: u.createdAt.toISOString(),
        lastActive: lastActive.toISOString(),
      };
    });

    console.log(`[Admin Candidates] Returning ${candidates.length} formatted candidates`);

    res.json({
      candidates,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    });
  } catch (err: any) {
    console.error("[/admin/candidates] Error:", {
      message: err.message,
      stack: err.stack,
    });

    res.status(500).json({
      error: "Internal server error",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
});

// GET /api/admin/candidates/:id
adminRouter.get("/candidates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const candidate = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        interviews: {
          include: {
            feedback: true,
            assessment: true,
            jobRole: true
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        resumes: {
          orderBy: {
            uploadedAt: 'desc'
          }
        }
      }
    });

    if (!candidate) {
      return res.status(404).json({ error: 'Candidate not found' });
    }

    res.json(candidate);
  } catch (error) {
    console.error('Error fetching candidate:', error);
    res.status(500).json({ error: 'Failed to fetch candidate' });
  }
});

// DELETE /api/admin/candidates/:id
adminRouter.delete("/candidates/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({ 
      where: { id }
    });

    if (!user) {
      return res.status(404).json({ error: "Candidate not found" });
    }

    await prisma.user.delete({ 
      where: { id } 
    });

    res.status(200).json({ success: true, message: "Candidate deleted" });
  } catch (err) {
    console.error("[DELETE /admin/candidates/:id] Error:", err);
    res.status(500).json({ error: "Failed to delete candidate" });
  }
});

// POST /api/admin/candidates/:id/suspend
adminRouter.post("/candidates/:id/suspend", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'SUSPENDED' }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error suspending candidate:', error);
    res.status(500).json({ error: 'Failed to suspend candidate' });
  }
});

// POST /api/admin/candidates/:id/activate
adminRouter.post("/candidates/:id/activate", async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: { status: 'ACTIVE' }
    });

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error activating candidate:', error);
    res.status(500).json({ error: 'Failed to activate candidate' });
  }
});

// GET /api/admin/interviews
adminRouter.get("/interviews", async (req, res) => {
  try {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    const interviews = await prisma.interview.findMany({
      where: status ? { status: status as any } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        user: { 
          select: { 
            id: true, 
            email: true, 
            role: true,
            name: true,
            profile: true
          } 
        },
        jobRole: { select: { id: true, title: true, category: true } },
        feedback: true,
        assessment: true,
      },
      take: 200,
    });
    res.json({ interviews });
  } catch (err) {
    console.error("[/admin/interviews] Error:", err);
    res.status(500).json({ error: "Failed to fetch interviews" });
  }
});

// DELETE /api/admin/interviews/:id
adminRouter.delete("/interviews/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const interview = await prisma.interview.findUnique({ where: { id } });

    if (!interview) {
      return res.status(404).json({ error: "Interview not found" });
    }

    await prisma.$transaction([
      prisma.interviewFeedback.deleteMany({ where: { interviewId: id } }),
      prisma.interviewAssessment.deleteMany({ where: { interviewId: id } }),
      prisma.interviewAnswer.deleteMany({ where: { interviewId: id } }),
      prisma.interviewQuestion.deleteMany({ where: { interviewId: id } }),
      prisma.interviewEvent.deleteMany({ where: { interviewId: id } }),
      prisma.interviewDocument.deleteMany({ where: { interviewId: id } }),
      prisma.interview.delete({ where: { id } }),
    ]);

    res.status(200).json({ success: true, message: "Interview deleted" });
  } catch (err) {
    console.error("[DELETE /admin/interviews/:id] Error:", err);
    res.status(500).json({ error: "Failed to delete interview" });
  }
});

export default adminRouter;


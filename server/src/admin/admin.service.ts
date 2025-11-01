import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  async getResultsGroupedByGroup() {
    const computeMaxPointsByCount = (count?: number | null) => {
      if (count === 10) return 100;
      if (count === 15) return 100;
      return null;
    };

    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        groupNumber: true,
        testResults: true,
      },
    });

    const withResults = users.filter(
      (u: any) => Array.isArray(u.testResults) && u.testResults.length > 0,
    );

    const normalizeLatest = (results: any[]) => {
      const sorted = [...results].sort((a, b) => {
        const at = a?.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bt = b?.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bt - at;
      });
      const latest = sorted[0] || {};
      return {
        grade: latest.grade ?? null,
        completed_at: latest.completed_at ?? null,
        test_code: latest.test_code ?? null,
        answers_details: latest.answers_details ?? [],
        score: latest.score ?? null,
        total_questions: latest.total_questions ?? null,
        variant: latest.variant ?? null,
        max_points: latest.max_points ?? computeMaxPointsByCount(latest.total_questions ?? null),
      };
    };

    const groupsMap = new Map<string, any[]>();
    const noGroup: any[] = [];

    for (const u of withResults) {
      const latest = normalizeLatest(u.testResults as any[]);
      const student = {
        id: u.id,
        email: u.email,
        fullName: u.fullName || '',
        grade: latest.grade,
        completed_at: latest.completed_at,
        test_code: latest.test_code,
        answers_details: latest.answers_details,
        score: latest.score,
        total_questions: latest.total_questions,
        variant: latest.variant,
        max_points: latest.max_points,
      };
      const key = (u.groupNumber || '').trim();
      if (!key) {
        noGroup.push(student);
      } else {
        if (!groupsMap.has(key)) groupsMap.set(key, []);
        groupsMap.get(key)!.push(student);
      }
    }

    // Sort students in each group by name, then by latest date desc
    for (const [k, arr] of groupsMap.entries()) {
      arr.sort((a, b) => {
        const nameA = (a.fullName || '').localeCompare(b.fullName || '');
        if (nameA !== 0) return nameA;
        const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
        const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
        return bt - at;
      });
    }
    noGroup.sort((a, b) => {
      const nameA = (a.fullName || '').localeCompare(b.fullName || '');
      if (nameA !== 0) return nameA;
      const at = a.completed_at ? new Date(a.completed_at).getTime() : 0;
      const bt = b.completed_at ? new Date(b.completed_at).getTime() : 0;
      return bt - at;
    });

    // Sort groups by numeric group number if possible
    const groups = Array.from(groupsMap.entries())
      .map(([groupNumber, students]) => ({ groupNumber, students }))
      .sort((a, b) => {
        const na = Number(a.groupNumber);
        const nb = Number(b.groupNumber);
        const aIsNum = !Number.isNaN(na);
        const bIsNum = !Number.isNaN(nb);
        if (aIsNum && bIsNum) return na - nb;
        if (aIsNum) return -1;
        if (bIsNum) return 1;
        return a.groupNumber.localeCompare(b.groupNumber);
      });

    return { groups, noGroup };
  }
}

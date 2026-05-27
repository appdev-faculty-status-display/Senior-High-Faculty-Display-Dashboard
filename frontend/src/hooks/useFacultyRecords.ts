import { useCallback, useEffect, useState } from 'react';
import { getFacultyListAdmin, type FacultyRecord } from '@/lib/facultyApi';

export function useFacultyRecords(strand?: string) {
  const [facultyRecords, setFacultyRecords] = useState<FacultyRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getFacultyListAdmin(strand);
      setFacultyRecords(res.data);
    } finally {
      setLoading(false);
    }
  }, [strand]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { facultyRecords, setFacultyRecords, loading, refresh };
}

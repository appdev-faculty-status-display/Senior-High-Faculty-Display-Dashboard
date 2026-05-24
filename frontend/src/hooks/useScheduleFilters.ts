// hooks/useScheduleFilters.ts

import { useState, useMemo, type Dispatch, type SetStateAction } from "react";
import type { FacultySchedule } from "@/types/schedule";
import { ROWS_PER_PAGE } from "@/data/mockAddSchedule";

interface UseScheduleFiltersReturn {
    strandFilter:       string;
    dayFilter:          string;
    roomFilter:         string;
    search:             string;
    schedulePage:       number;
    setStrandFilter:    (v: string) => void;
    setDayFilter:       (v: string) => void;
    setRoomFilter:      (v: string) => void;
    setSearch:          (v: string) => void;
    setSchedulePage:    Dispatch<SetStateAction<number>>;
    handleFilterChange: (setter: (v: string) => void) => (value: string) => void;
    filtered:           FacultySchedule[];
    paginated:          FacultySchedule[];
    totalPages:         number;
}

export function useScheduleFilters(schedules: FacultySchedule[]): UseScheduleFiltersReturn {
    const [strandFilter, setStrandFilter] = useState("All Strands");
    const [dayFilter,    setDayFilter]    = useState("All Days");
    const [roomFilter,   setRoomFilter]   = useState("All Rooms");
    const [search,       setSearch]       = useState("");
    const [schedulePage, setSchedulePage] = useState(1);

    const filtered = useMemo(() =>
        schedules.filter((s) => {
            const matchStrand = strandFilter === "All Strands" || s.strand === strandFilter;
            const matchDay    = dayFilter    === "All Days"    || s.day    === dayFilter;
            const matchRoom   = roomFilter   === "All Rooms"   || s.room   === roomFilter;
            const matchSearch =
                search === "" ||
                s.name.toLowerCase().includes(search.toLowerCase()) ||
                s.subject.toLowerCase().includes(search.toLowerCase());
            return matchStrand && matchDay && matchRoom && matchSearch;
        }),
        [schedules, strandFilter, dayFilter, roomFilter, search]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));

    const paginated = useMemo(() =>
        filtered.slice(
            (schedulePage - 1) * ROWS_PER_PAGE,
            schedulePage * ROWS_PER_PAGE
        ),
        [filtered, schedulePage]
    );

    const handleFilterChange = (setter: (v: string) => void) => (value: string) => {
        setter(value);
        setSchedulePage(1);
    };

    return {
        strandFilter,
        dayFilter,
        roomFilter,
        search,
        schedulePage,
        setStrandFilter,
        setDayFilter,
        setRoomFilter,
        setSearch,
        setSchedulePage,
        handleFilterChange,
        filtered,
        paginated,
        totalPages,
    };
}
import React from "react"
import CourseCard from "@/components/CourseCard"
import type { Course } from "@/types"
import type { EnrichedCourse } from "@/lib/courseCategories"

export interface CourseGridListProps {
  courses: (Course | EnrichedCourse)[]
  viewMode?: "grid" | "list"
  enrolledMap?: Record<
    string,
    {
      percent: number
      completed: number
      total: number
      lastActiveLectureId?: string | null
    }
  >
  className?: string
  emptyMessage?: string
}

export default function CourseGridList({
  courses,
  viewMode = "grid",
  enrolledMap = {},
  className = "",
  emptyMessage,
}: CourseGridListProps) {
  if (!courses || courses.length === 0) {
    if (emptyMessage) {
      return (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      )
    }
    return null
  }

  return (
    <div
      className={
        viewMode === "grid"
          ? `grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${className}`
          : `flex flex-col gap-4 ${className}`
      }
    >
      {courses.map((course, index) => {
        const enrollment = enrolledMap[course.id]
        const isEnrolled = Boolean(enrollment)
        const progressPercent = enrollment?.percent || 0
        const completedLectures = enrollment?.completed || 0
        const totalLectures = enrollment?.total || (course as EnrichedCourse).lectures_count || 10

        return (
          <CourseCard
            key={course.id}
            course={course}
            viewMode={viewMode}
            isEnrolled={isEnrolled}
            progressPercent={progressPercent}
            completedLectures={completedLectures}
            totalLecturesOverride={totalLectures}
            lastActiveLectureId={enrollment?.lastActiveLectureId}
            index={index}
          />
        )
      })}
    </div>
  )
}

import React from "react";
import type { Todo } from "../types";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarViewProps {
  todos: Todo[];
  currentDate: Date;
  selectedDate: string | null;
  onChangeMonth: (offset: number) => void;
  onSelectDate: (date: string) => void;
}

const WEEKDAY_HEADERS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function formatYearMonth(d: Date): string {
  return d.toISOString().slice(0, 7);
}

function startOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
}

function endOfMonth(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0));
}

function addDays(d: Date, n: number): Date {
  return new Date(d.getTime() + n * 86400000);
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function buildGridDays(currentDate: Date): Date[] {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const gridStart = addDays(monthStart, -monthStart.getUTCDay());
  const leadingDays = monthStart.getUTCDay();
  const totalDaysInMonth = monthEnd.getUTCDate();
  const totalCells = Math.ceil((leadingDays + totalDaysInMonth) / 7) * 7;
  const cellCount = Math.max(totalCells, 42);
  const days: Date[] = [];
  for (let i = 0; i < cellCount; i++) {
    days.push(addDays(gridStart, i));
  }
  return days;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  todos,
  currentDate,
  selectedDate,
  onChangeMonth,
  onSelectDate,
}) => {
  const monthLabel = currentDate.toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
  const days = buildGridDays(currentDate);
  const visibleYearMonth = formatYearMonth(currentDate);
  const todayStr = isoDate(new Date());

  const todoCountByDate = new Map<string, number>();
  for (const todo of todos) {
    if (!todo.due_date) continue;
    todoCountByDate.set(todo.due_date, (todoCountByDate.get(todo.due_date) ?? 0) + 1);
  }

  const handleDayClick = (day: Date) => {
    const dateStr = isoDate(day);
    if (selectedDate === dateStr) {
      onSelectDate("");
    } else {
      onSelectDate(dateStr);
    }
  };

  return (
    <div className="calendar-view">
      <div className="calendar-header">
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => onChangeMonth(-1)}
          aria-label="Previous month"
        >
          <ChevronLeft size={14} />
        </button>
        <span className="calendar-month-label">{monthLabel}</span>
        <button
          className="btn btn-ghost btn-xs"
          onClick={() => onChangeMonth(1)}
          aria-label="Next month"
        >
          <ChevronRight size={14} />
        </button>
      </div>

      <div className="calendar-grid">
        {WEEKDAY_HEADERS.map((label) => (
          <div key={label} className="calendar-weekday-header">
            {label}
          </div>
        ))}

        {days.map((day) => {
          const dateStr = isoDate(day);
          const inMonth = formatYearMonth(day) === visibleYearMonth;
          const count = todoCountByDate.get(dateStr) ?? 0;
          const isSelected = selectedDate === dateStr;
          const isToday = dateStr === todayStr;

          const classes = [
            "calendar-day",
            inMonth ? "calendar-day-in-month" : "calendar-day-out",
            isSelected ? "calendar-day-selected" : "",
            isToday ? "calendar-day-today" : "",
          ]
            .filter(Boolean)
            .join(" ");

          return (
            <button
              key={dateStr}
              type="button"
              className={classes}
              onClick={() => handleDayClick(day)}
              aria-pressed={isSelected}
              aria-label={`${dateStr}${count > 0 ? `, ${count} task${count === 1 ? "" : "s"}` : ""}`}
            >
              <span className="calendar-day-number">{day.getUTCDate()}</span>
              {count > 0 && (
                <span className="calendar-day-indicator" aria-hidden="true">
                  <span className="calendar-day-dot" />
                  <span className="calendar-day-count">{count}</span>
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

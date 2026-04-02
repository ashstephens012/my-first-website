import { format } from 'date-fns';

interface Meeting {
  id: string;
  date: Date;
  subject: string;
  participants: string[];
}

export default function UpcomingMeetings({ meetings }: { meetings: Meeting[] }) {
  if (meetings.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
        <p className="text-gray-500">No upcoming meetings scheduled.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
      {meetings.map((meeting) => (
        <div key={meeting.id} className="flex items-center gap-4 px-5 py-4">
          <div className="flex-shrink-0 w-14 text-center">
            <div className="text-xs font-medium text-gray-400 uppercase">
              {format(meeting.date, 'MMM')}
            </div>
            <div className="text-xl font-bold text-brand-navy leading-tight">
              {format(meeting.date, 'd')}
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-brand-navy truncate">
              {meeting.subject}
            </p>
            <p className="text-xs text-gray-500">
              {format(meeting.date, 'EEEE, MMMM d · h:mm a')}
            </p>
            {meeting.participants.length > 0 && (
              <p className="text-xs text-gray-400 mt-0.5">
                {meeting.participants.join(', ')}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

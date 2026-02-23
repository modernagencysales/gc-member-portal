import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchAllMembers } from '../../../services/supabase';
import { queryKeys } from '../../../lib/queryClient';
import { useTheme } from '../../../context/ThemeContext';
import { Users } from 'lucide-react';

interface MemberSelectProps {
  value: string | null;
  onChange: (memberId: string | null) => void;
}

const MemberSelect: React.FC<MemberSelectProps> = ({ value, onChange }) => {
  const { isDarkMode } = useTheme();

  const { data: members, isLoading } = useQuery({
    queryKey: queryKeys.adminMembers(),
    queryFn: fetchAllMembers,
  });

  return (
    <div className="flex items-center gap-3">
      <Users className={`w-5 h-5 ${isDarkMode ? 'text-zinc-400' : 'text-zinc-500'}`} />
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || null)}
        disabled={isLoading}
        className={`flex-1 px-3 py-2 rounded-lg border text-sm ${
          isDarkMode
            ? 'bg-zinc-800 border-zinc-700 text-zinc-100'
            : 'bg-white border-zinc-300 text-zinc-900'
        } focus:outline-none focus:ring-2 focus:ring-violet-500`}
      >
        <option value="">Select a member...</option>
        {members?.map((member) => (
          <option key={member.id} value={member.id}>
            {member.name || member.email} ({member.company || 'No company'})
          </option>
        ))}
      </select>
    </div>
  );
};

export default MemberSelect;

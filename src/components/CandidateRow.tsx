// import { Button } from "./ui/button";
// import ScoreBar from "./ScoreBar";

// interface CandidateRowProps {
//   name: string;
//   email: string;
//   totalInterviews: number;
//   avgScore: number;
//   lastActive: string;
//   initials: string;
//   color: string;
// }

// const CandidateRow = ({ 
//   name, 
//   email, 
//   totalInterviews, 
//   avgScore, 
//   lastActive,
//   initials,
//   color 
// }: CandidateRowProps) => {
//   return (
//     <tr className="border-b border-border hover:bg-secondary/30 transition-colors">
//       <td className="py-4 px-4">
//         <div className="flex items-center gap-3">
//           <div 
//             className="h-9 w-9 rounded-full flex items-center justify-center text-sm font-medium text-foreground"
//             style={{ backgroundColor: color }}
//           >
//             {initials}
//           </div>
//           <span className="font-medium text-foreground">{name}</span>
//         </div>
//       </td>
//       <td className="py-4 px-4 text-muted-foreground">{email}</td>
//       <td className="py-4 px-4 text-center text-foreground">{totalInterviews}</td>
//       <td className="py-4 px-4 w-32">
//         <div className="flex items-center gap-2">
//           <div className="flex-1">
//             <ScoreBar score={avgScore} size="sm" showLabel={false} />
//           </div>
//           <span className="text-sm text-foreground">{avgScore}%</span>
//         </div>
//       </td>
//       <td className="py-4 px-4 text-muted-foreground">{lastActive}</td>
//       <td className="py-4 px-4">
//         <Button size="sm" className="gradient-primary text-primary-foreground hover:opacity-90">
//           Review
//         </Button>
//       </td>
//     </tr>
//   );
// };

// export default CandidateRow;

import { MoreVertical, Eye, Trash2, Ban, UserCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface CandidateRowProps {
  name: string;
  email: string;
  totalInterviews: number;
  avgScore: number;
  lastActive: string;
  initials: string;
  color: string;
  status?: string;
  skills?: string[];
  onAction?: (action: string, id: string) => void;
  id?: string;
}

const CandidateRow = ({ 
  name, 
  email, 
  totalInterviews, 
  avgScore, 
  lastActive, 
  initials, 
  color,
  status = 'active',
  skills = [],
  onAction,
  id
}: CandidateRowProps) => {
  const getStatusBadge = () => {
    switch(status?.toLowerCase()) {
      case 'active':
        return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">Active</Badge>;
      case 'inactive':
        return <Badge variant="secondary">Inactive</Badge>;
      case 'suspended':
        return <Badge variant="destructive">Suspended</Badge>;
      case 'pending':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600';
    if (score >= 75) return 'text-blue-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <tr className="border-b border-border hover:bg-secondary/10 transition-colors">
      <td className="py-4 px-4">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium text-sm"
            style={{ backgroundColor: color }}
          >
            {initials}
          </div>
          <span className="font-medium text-foreground">{name}</span>
        </div>
      </td>
      <td className="py-4 px-4 text-muted-foreground">{email}</td>
      <td className="py-4 px-4 text-center text-muted-foreground">{totalInterviews}</td>
      <td className="py-4 px-4">
        <span className={`font-medium ${getScoreColor(avgScore)}`}>
          {avgScore}%
        </span>
      </td>
      <td className="py-4 px-4 text-muted-foreground">
        {new Date(lastActive).toLocaleDateString()}
      </td>
      <td className="py-4 px-4 text-center">
        {getStatusBadge()}
      </td>
      <td className="py-4 px-4 text-center">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical size={16} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => onAction?.('view', id || email)}>
              <Eye size={16} className="mr-2" />
              View Details
            </DropdownMenuItem>
            {status?.toLowerCase() === 'active' ? (
              <DropdownMenuItem onClick={() => onAction?.('suspend', id || email)}>
                <Ban size={16} className="mr-2" />
                Suspend
              </DropdownMenuItem>
            ) : status?.toLowerCase() === 'suspended' ? (
              <DropdownMenuItem onClick={() => onAction?.('activate', id || email)}>
                <UserCheck size={16} className="mr-2" />
                Activate
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => onAction?.('delete', id || email)}
              className="text-red-600 focus:text-red-600"
            >
              <Trash2 size={16} className="mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
};

export default CandidateRow;
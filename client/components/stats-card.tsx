import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  iconBg: string;
  iconColor: string;
  change?: string;
  changeLabel?: string;
  isPositive?: boolean;
  showProgress?: boolean;
  progressValue?: number;
  subtitle?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  change,
  changeLabel,
  isPositive,
  showProgress,
  progressValue,
  subtitle
}: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-secondary text-sm font-medium" data-testid={`text-stats-title-${title.replace(/\s+/g, '-').toLowerCase()}`}>
              {title}
            </p>
            <p className="text-2xl font-bold text-text-dark" data-testid={`text-stats-value-${title.replace(/\s+/g, '-').toLowerCase()}`}>
              {value}
            </p>
          </div>
          <div className={`w-12 h-12 ${iconBg} rounded-lg flex items-center justify-center`}>
            <i className={`${icon} ${iconColor}`}></i>
          </div>
        </div>
        
        {/* Change indicator */}
        {change && changeLabel && (
          <div className="mt-4 flex items-center">
            <span className={`text-sm font-medium ${isPositive ? 'text-green-600' : 'text-primary'}`}>
              {change}
            </span>
            <span className="text-secondary text-sm ml-1">{changeLabel}</span>
          </div>
        )}
        
        {/* Progress bar */}
        {showProgress && progressValue !== undefined && (
          <div className="mt-4">
            <Progress 
              value={progressValue} 
              className="h-2"
              data-testid={`progress-${title.replace(/\s+/g, '-').toLowerCase()}`}
            />
          </div>
        )}
        
        {/* Subtitle */}
        {subtitle && (
          <div className="mt-4 flex items-center">
            <span className="text-secondary text-sm" data-testid={`text-stats-subtitle-${title.replace(/\s+/g, '-').toLowerCase()}`}>
              {subtitle}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

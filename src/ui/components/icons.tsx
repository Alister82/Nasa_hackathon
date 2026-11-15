/**
 * Vigil icon set.
 *
 * Single source of truth for interface glyphs. Built on Phosphor's
 * hand-drawn family, whose rounded terminals and optical weights sit close
 * to Apple's SF Symbols. Icons inherit `currentColor` and size from
 * `className` (default 1em).
 *
 * Weight guidance:
 *   regular — default for interface glyphs at 16px and above
 *   bold    — small glyphs inside chips, badges and dense controls
 *   fill    — glyphs sitting in tinted rounded tiles (Health-app style)
 *   duotone — avoid; it reads as decorative rather than functional
 */
import type { Icon, IconProps, IconWeight } from '@phosphor-icons/react';

export type { IconProps, IconWeight };
export type IconComponent = Icon;

export {
  /* Navigation & chrome */
  ActivityIcon as Activity,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  ArrowElbowDownLeft as CornerDownLeft,
  Bell,
  CaretDown as ChevronDown,
  CaretRight as ChevronRight,
  DotsThree as MoreHorizontal,
  List as Menu,
  MagnifyingGlass as Search,
  SidebarSimple as PanelLeftClose,
  SidebarSimple as PanelLeftOpen,
  X,

  /* Status & guidance */
  Check,
  CheckCircle as CheckCircle2,
  Warning as AlertTriangle,
  Warning as TriangleAlert,
  WarningCircle as CircleAlert,
  WarningOctagon as AlertOctagon,
  Info,
  Question as CircleHelp,
  Prohibit as CircleSlash,
  Flag,
  Eye,
  ShieldCheck,
  ShieldWarning as ShieldAlert,
  Target,
  Sparkle as Sparkles,
  Lightning as Zap,
  Minus,
  TrendUp as TrendingUp,
  TrendDown as TrendingDown,

  /* Monitoring & health */
  Heartbeat as HeartPulse,
  Stethoscope,
  FirstAidKit as BriefcaseMedical,
  Pill,
  Thermometer,
  Drop as Droplets,
  Barbell as Dumbbell,
  Brain,
  Smiley as Smile,
  MoonStars as MoonStar,
  Radioactive as Radiation,
  Waves,
  Pulse,

  /* Mission & operations */
  SquaresFour as LayoutDashboard,
  ChartLine as LineChart,
  Flask as FlaskConical,
  TestTube as TestTube2,
  Notebook,
  Notebook as NotebookPen,
  BookOpen,
  BookmarkSimple as Bookmark,
  ClipboardText as ClipboardCheck,
  ListChecks as ClipboardList,
  CalendarDots as CalendarDays,
  CalendarDots as CalendarClock,
  Clock as Clock3,
  Timer,
  Play,
  SkipForward,
  Crosshair,
  Scan as Radar,
  Radio,
  Planet as Satellite,
  Binoculars as Telescope,
  GearSix as Settings2,
  SlidersHorizontal,
  Funnel as Filter,
  UserCircle as UserRound,
  Lifebuoy as LifeBuoy,

  /* Data & system */
  Database,
  HardDrives as HardDriveDownload,
  FloppyDisk as Save,
  FileText,
  Terminal,
  ArrowSquareOut as ExternalLink,
  ChatText as MessageSquareText,
  CellSignalHigh as Signal,
  WifiHigh as Wifi,
  WifiSlash as WifiOff,
} from '@phosphor-icons/react';

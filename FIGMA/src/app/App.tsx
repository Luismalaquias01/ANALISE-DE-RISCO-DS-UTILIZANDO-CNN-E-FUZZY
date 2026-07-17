import { useState } from "react";
import {
  Activity,
  Brain,
  Database,
  Eye,
  Clock,
  FileText,
  TrendingUp,
  Zap,
  AlertTriangle,
  CheckCircle2,
  Circle,
  ChevronRight,
  Cloud,
  Mountain,
  Skull
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";

type Screen = "dashboard" | "training" | "dataset" | "realtime" | "timeline" | "reports";

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>("dashboard");

  return (
    <div className="min-h-screen bg-background text-foreground dark">
      {/* Navigation */}
      <nav className="border-b border-border bg-secondary/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-light flex items-center justify-center">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg">DS Environment Intelligence</span>
            </div>
            <div className="flex items-center gap-1 bg-card rounded-lg p-1">
              <NavButton icon={Activity} label="Dashboard" active={activeScreen === "dashboard"} onClick={() => setActiveScreen("dashboard")} />
              <NavButton icon={Brain} label="Training" active={activeScreen === "training"} onClick={() => setActiveScreen("training")} />
              <NavButton icon={Database} label="Dataset" active={activeScreen === "dataset"} onClick={() => setActiveScreen("dataset")} />
              <NavButton icon={Eye} label="Real-time" active={activeScreen === "realtime"} onClick={() => setActiveScreen("realtime")} />
              <NavButton icon={Clock} label="Timeline" active={activeScreen === "timeline"} onClick={() => setActiveScreen("timeline")} />
              <NavButton icon={FileText} label="Reports" active={activeScreen === "reports"} onClick={() => setActiveScreen("reports")} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
            <span className="text-sm text-muted-foreground">System Online</span>
          </div>
        </div>
      </nav>

      {/* Content */}
      <main className="p-8">
        {activeScreen === "dashboard" && <Dashboard />}
        {activeScreen === "training" && <Training />}
        {activeScreen === "dataset" && <Dataset />}
        {activeScreen === "realtime" && <RealTime />}
        {activeScreen === "timeline" && <Timeline />}
        {activeScreen === "reports" && <Reports />}
      </main>
    </div>
  );
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: any; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
        active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-card-highlight"
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Dashboard() {
  const accuracyData = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    accuracy: 0.45 + (i * 0.015) + (Math.random() * 0.03),
  }));

  const lossData = Array.from({ length: 30 }, (_, i) => ({
    epoch: i + 1,
    loss: 1.2 - (i * 0.035) + (Math.random() * 0.05),
  }));

  const classDistribution = [
    { name: "Clear", value: 1243, color: "#3B82F6" },
    { name: "Timefall", value: 1089, color: "#60A5FA" },
    { name: "Snow", value: 892, color: "#22C55E" },
    { name: "Plains", value: 1456, color: "#FACC15" },
    { name: "Mountains", value: 1122, color: "#FB923C" },
    { name: "BT Territory", value: 784, color: "#EF4444" },
  ];

  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-card via-card-highlight to-card rounded-2xl p-12 border border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent"></div>
        <div className="relative z-10">
          <h1 className="text-5xl font-bold mb-4">DS Environment Intelligence</h1>
          <p className="text-lg text-muted-foreground max-w-3xl">
            Sistema Inteligente de Classificação Ambiental e Análise de Risco em Death Stranding utilizando CNN e Lógica Fuzzy
          </p>
        </div>
      </div>

      {/* Model Status Grid */}
      <div className="grid grid-cols-6 gap-4">
        <MetricCard label="Status" value="Online" icon={CheckCircle2} color="success" />
        <MetricCard label="Accuracy" value="92.4%" icon={TrendingUp} color="primary" />
        <MetricCard label="Loss" value="0.187" icon={Activity} color="warning" />
        <MetricCard label="GPU Usage" value="73%" icon={Zap} color="orange" />
        <MetricCard label="Frames Analyzed" value="34,829" icon={Eye} color="primary-light" />
        <MetricCard label="Inference Time" value="12ms" icon={Activity} color="success" />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Model Accuracy over Epochs">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={accuracyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="epoch" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} domain={[0, 1]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161D29",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  color: "#FFFFFF"
                }}
              />
              <Line type="monotone" dataKey="accuracy" stroke="#3B82F6" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Training Loss over Epochs">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={lossData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="epoch" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161D29",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  color: "#FFFFFF"
                }}
              />
              <Line type="monotone" dataKey="loss" stroke="#EF4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Class Distribution Heatmap */}
      <ChartCard title="Class Distribution Heatmap">
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={classDistribution} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis type="number" stroke="#9CA3AF" style={{ fontSize: 12 }} />
            <YAxis dataKey="name" type="category" stroke="#9CA3AF" style={{ fontSize: 12 }} width={120} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161D29",
                border: "1px solid rgba(255,255,255,0.06)",
                borderRadius: "8px",
                color: "#FFFFFF"
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]}>
              {classDistribution.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}

function Training() {
  const [selectedMetric, setSelectedMetric] = useState<"accuracy" | "loss" | "precision" | "recall">("accuracy");

  const metricsData = Array.from({ length: 50 }, (_, i) => ({
    epoch: i + 1,
    accuracy: 0.4 + (i * 0.012) + (Math.random() * 0.02),
    loss: 1.5 - (i * 0.028) + (Math.random() * 0.04),
    precision: 0.38 + (i * 0.011) + (Math.random() * 0.025),
    recall: 0.42 + (i * 0.01) + (Math.random() * 0.022),
  }));

  const confusionMatrix = [
    [142, 8, 3, 2, 1, 0],
    [5, 138, 7, 4, 2, 1],
    [2, 6, 131, 8, 3, 2],
    [1, 3, 5, 145, 6, 4],
    [0, 2, 4, 7, 139, 5],
    [0, 1, 2, 3, 8, 126],
  ];

  const classes = ["Clear", "Timefall", "Snow", "Plains", "Mountains", "BT Territory"];

  return (
    <div className="grid grid-cols-12 gap-6">
      {/* Configuration Panel */}
      <div className="col-span-3 space-y-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Configuration</h3>
          <div className="space-y-4 text-sm">
            <ConfigItem label="Model" value="ResNet-50" />
            <ConfigItem label="Optimizer" value="Adam" />
            <ConfigItem label="Learning Rate" value="0.001" />
            <ConfigItem label="Batch Size" value="32" />
            <ConfigItem label="Epochs" value="50" />
            <ConfigItem label="Data Augmentation" value="Enabled" />
          </div>
          <button className="w-full mt-6 bg-primary hover:bg-primary-light text-primary-foreground font-medium py-2.5 rounded-lg transition-colors">
            Start Training
          </button>
        </div>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Hardware</h3>
          <div className="space-y-4 text-sm">
            <ConfigItem label="GPU" value="NVIDIA RTX 4090" />
            <ConfigItem label="VRAM" value="24GB" />
            <ConfigItem label="Utilization" value="73%" />
            <ConfigItem label="Temperature" value="68°C" />
          </div>
        </div>
      </div>

      {/* Main Chart */}
      <div className="col-span-9 space-y-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold">Training Metrics</h2>
            <div className="flex gap-2">
              <MetricButton label="Accuracy" active={selectedMetric === "accuracy"} onClick={() => setSelectedMetric("accuracy")} />
              <MetricButton label="Loss" active={selectedMetric === "loss"} onClick={() => setSelectedMetric("loss")} />
              <MetricButton label="Precision" active={selectedMetric === "precision"} onClick={() => setSelectedMetric("precision")} />
              <MetricButton label="Recall" active={selectedMetric === "recall"} onClick={() => setSelectedMetric("recall")} />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={metricsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="epoch" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161D29",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  color: "#FFFFFF"
                }}
              />
              <Line type="monotone" dataKey={selectedMetric} stroke="#3B82F6" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Accuracy</div>
            <div className="text-2xl font-semibold">94.2%</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Loss</div>
            <div className="text-2xl font-semibold">0.174</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">Precision</div>
            <div className="text-2xl font-semibold">93.8%</div>
          </div>
          <div className="bg-card border border-border rounded-xl p-4">
            <div className="text-xs text-muted-foreground mb-1">F1 Score</div>
            <div className="text-2xl font-semibold">94.0%</div>
          </div>
        </div>

        {/* Confusion Matrix */}
        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-6">Confusion Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr>
                  <th className="text-left text-xs text-muted-foreground pb-4 pr-4"></th>
                  {classes.map((cls) => (
                    <th key={cls} className="text-center text-xs text-muted-foreground pb-4 px-2">{cls}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {confusionMatrix.map((row, i) => (
                  <tr key={i}>
                    <td className="text-xs text-muted-foreground pr-4 py-2">{classes[i]}</td>
                    {row.map((value, j) => {
                      const isCorrect = i === j;
                      const opacity = value / Math.max(...row);
                      return (
                        <td key={j} className="px-2 py-2">
                          <div
                            className={`w-full h-12 rounded flex items-center justify-center text-sm font-medium ${
                              isCorrect ? "bg-success text-white" : "bg-card-highlight text-muted-foreground"
                            }`}
                            style={{ opacity: isCorrect ? 1 : 0.3 + (opacity * 0.7) }}
                          >
                            {value}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

function Dataset() {
  const climateClasses = [
    { name: "Clear Sky", count: 1243, balance: 0.95, status: "complete" },
    { name: "Timefall", count: 1089, balance: 0.83, status: "complete" },
    { name: "Heavy Rain", count: 967, balance: 0.74, status: "complete" },
    { name: "Snow", count: 892, balance: 0.68, status: "incomplete" },
  ];

  const terrainClasses = [
    { name: "Plains", count: 1456, balance: 1.0, status: "complete" },
    { name: "Rocky Hills", count: 1334, balance: 0.92, status: "complete" },
    { name: "Mountains", count: 1122, balance: 0.77, status: "complete" },
    { name: "Water Crossing", count: 889, balance: 0.61, status: "incomplete" },
  ];

  const btClasses = [
    { name: "BT Territory", count: 784, balance: 0.89, status: "complete" },
    { name: "BT Nearby", count: 623, balance: 0.71, status: "incomplete" },
    { name: "Clear Area", count: 1876, balance: 1.0, status: "complete" },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dataset Management</h1>
          <p className="text-muted-foreground">Environmental classification dataset with 12,275 annotated frames</p>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium hover:bg-card-highlight transition-colors">
            Import Images
          </button>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors">
            Export Dataset
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-6">
        <DatasetCategory title="Climate Classification" classes={climateClasses} icon={Cloud} />
        <DatasetCategory title="Terrain Type" classes={terrainClasses} icon={Mountain} />
        <DatasetCategory title="BT Presence" classes={btClasses} icon={Skull} />
      </div>

      {/* Dataset Statistics */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-2">Total Images</div>
          <div className="text-3xl font-bold mb-1">12,275</div>
          <div className="text-xs text-success flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            +342 this week
          </div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-2">Annotated</div>
          <div className="text-3xl font-bold mb-1">11,847</div>
          <div className="text-xs text-muted-foreground">96.5% complete</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-2">Training Set</div>
          <div className="text-3xl font-bold mb-1">9,478</div>
          <div className="text-xs text-muted-foreground">80% split</div>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="text-sm text-muted-foreground mb-2">Validation Set</div>
          <div className="text-3xl font-bold mb-1">2,369</div>
          <div className="text-xs text-muted-foreground">20% split</div>
        </div>
      </div>
    </div>
  );
}

function RealTime() {
  const [riskLevel, setRiskLevel] = useState(73);

  const cnnPredictions = [
    { category: "Climate", class: "Timefall", probability: 0.94 },
    { category: "Terrain", class: "Mountains", probability: 0.89 },
    { category: "BT Presence", class: "BT Nearby", probability: 0.78 },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Real-time Classification</h1>
        <p className="text-muted-foreground">Live environmental analysis and risk assessment</p>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Frame Capture */}
        <div className="col-span-5 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="aspect-video bg-gradient-to-br from-card-highlight to-secondary rounded-lg mb-4 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-destructive/10"></div>
              <Eye className="w-16 h-16 text-muted-foreground/30" />
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-muted-foreground text-xs mb-1">FPS</div>
                <div className="font-semibold">60</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Timestamp</div>
                <div className="font-semibold">00:34:12</div>
              </div>
              <div>
                <div className="text-muted-foreground text-xs mb-1">Resolution</div>
                <div className="font-semibold">1920×1080</div>
              </div>
            </div>
          </div>
        </div>

        {/* CNN Predictions */}
        <div className="col-span-4 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Brain className="w-4 h-4 text-primary" />
              CNN Predictions
            </h3>
            <div className="space-y-6">
              {cnnPredictions.map((pred) => (
                <div key={pred.category}>
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground">{pred.category}</div>
                      <div className="font-semibold">{pred.class}</div>
                    </div>
                    <div className="text-lg font-bold text-primary">{(pred.probability * 100).toFixed(1)}%</div>
                  </div>
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-primary-light rounded-full transition-all duration-500"
                      style={{ width: `${pred.probability * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Fuzzy Logic Risk Assessment */}
        <div className="col-span-3 space-y-4">
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="font-semibold mb-6 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Risk Assessment
            </h3>

            {/* Circular Risk Gauge */}
            <div className="flex items-center justify-center mb-6">
              <div className="relative w-40 h-40">
                <svg className="w-full h-full -rotate-90">
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke="rgba(255,255,255,0.06)"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="80"
                    cy="80"
                    r="70"
                    stroke={riskLevel > 70 ? "#EF4444" : riskLevel > 40 ? "#FACC15" : "#22C55E"}
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 70}`}
                    strokeDashoffset={`${2 * Math.PI * 70 * (1 - riskLevel / 100)}`}
                    strokeLinecap="round"
                    className="transition-all duration-500"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-4xl font-bold">{riskLevel}%</div>
                  <div className="text-xs text-muted-foreground">Risk Level</div>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <RiskMetric label="Attack Risk" value={78} />
              <RiskMetric label="Traversal Difficulty" value={65} />
              <RiskMetric label="General Danger" value={73} />
            </div>
          </div>
        </div>
      </div>

      {/* Diagnostic */}
      <div className="bg-card-highlight border border-border rounded-xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-warning/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div>
            <div className="font-semibold mb-1">Environment Analysis</div>
            <p className="text-sm text-muted-foreground">
              BT presence detected in mountainous terrain with active timefall. Risk elevated due to hostile interaction probability. Recommended action: avoid direct confrontation, seek elevated ground, prepare countermeasures.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function Timeline() {
  const events = [
    { time: "00:12", type: "detection", title: "Timefall Detected", desc: "Heavy precipitation pattern identified", severity: "warning" },
    { time: "00:25", type: "alert", title: "BT Territory Identified", desc: "Multiple BT signatures in vicinity", severity: "danger" },
    { time: "00:42", type: "combat", title: "Combat Initiated", desc: "Hostile encounter with BT entity", severity: "danger" },
    { time: "01:11", type: "boss", title: "Boss Entity Detected", desc: "Large-scale BT boss pattern recognized", severity: "critical" },
    { time: "01:34", type: "clear", title: "Threat Neutralized", desc: "Combat resolved, area cleared", severity: "success" },
    { time: "02:08", type: "terrain", title: "Terrain Change", desc: "Entering mountainous region", severity: "info" },
    { time: "02:45", type: "weather", title: "Weather Shift", desc: "Timefall intensity decreasing", severity: "success" },
    { time: "03:12", type: "detection", title: "Clear Conditions", desc: "Optimal traversal conditions", severity: "success" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Event Timeline</h1>
        <p className="text-muted-foreground">Chronological analysis of environmental events and system detections</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-8">
        <div className="space-y-1">
          {events.map((event, index) => (
            <TimelineEvent key={index} {...event} isLast={index === events.length - 1} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Reports() {
  const performanceMetrics = [
    { metric: "Overall Accuracy", value: "94.2%", change: "+2.3%" },
    { metric: "Precision", value: "93.8%", change: "+1.9%" },
    { metric: "Recall", value: "94.5%", change: "+2.1%" },
    { metric: "F1 Score", value: "94.0%", change: "+2.0%" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">System Reports</h1>
          <p className="text-muted-foreground">Comprehensive analysis and performance metrics</p>
        </div>
        <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary-light transition-colors flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Export PDF Report
        </button>
      </div>

      {/* Performance Summary */}
      <div className="grid grid-cols-4 gap-4">
        {performanceMetrics.map((item) => (
          <div key={item.metric} className="bg-card border border-border rounded-xl p-6">
            <div className="text-sm text-muted-foreground mb-2">{item.metric}</div>
            <div className="text-3xl font-bold mb-1">{item.value}</div>
            <div className="text-xs text-success flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {item.change}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-2 gap-6">
        <ChartCard title="Classification Performance">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={[
              { name: "Climate", accuracy: 95.2 },
              { name: "Terrain", accuracy: 94.1 },
              { name: "BT Detection", accuracy: 93.4 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#9CA3AF" style={{ fontSize: 12 }} />
              <YAxis stroke="#9CA3AF" style={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#161D29",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  color: "#FFFFFF"
                }}
              />
              <Bar dataKey="accuracy" fill="#3B82F6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <div className="bg-card border border-border rounded-xl p-6">
          <h3 className="font-semibold mb-4">Summary</h3>
          <div className="space-y-4 text-sm">
            <p className="text-muted-foreground leading-relaxed">
              The DS Environment Intelligence system demonstrates exceptional performance across all classification categories. The CNN model, trained on 12,275 annotated frames, achieves 94.2% overall accuracy with balanced precision and recall metrics.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Fuzzy logic integration provides robust risk assessment capabilities, enabling real-time decision support for environmental navigation and threat avoidance. System inference time averages 12ms per frame, suitable for real-time applications.
            </p>
            <div className="pt-4 border-t border-border">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Training Duration</div>
                  <div className="font-semibold">4.2 hours</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Model Size</div>
                  <div className="font-semibold">94.3 MB</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="font-semibold mb-4">Detailed Classification Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-sm text-muted-foreground font-medium pb-3">Class</th>
                <th className="text-right text-sm text-muted-foreground font-medium pb-3">Precision</th>
                <th className="text-right text-sm text-muted-foreground font-medium pb-3">Recall</th>
                <th className="text-right text-sm text-muted-foreground font-medium pb-3">F1 Score</th>
                <th className="text-right text-sm text-muted-foreground font-medium pb-3">Support</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[
                { class: "Clear Sky", precision: 96.2, recall: 95.8, f1: 96.0, support: 1243 },
                { class: "Timefall", precision: 94.1, recall: 93.7, f1: 93.9, support: 1089 },
                { class: "Snow", precision: 92.3, recall: 91.8, f1: 92.0, support: 892 },
                { class: "Plains", precision: 97.1, recall: 96.5, f1: 96.8, support: 1456 },
                { class: "Mountains", precision: 93.8, recall: 94.2, f1: 94.0, support: 1122 },
                { class: "BT Territory", precision: 91.4, recall: 90.8, f1: 91.1, support: 784 },
              ].map((row) => (
                <tr key={row.class}>
                  <td className="py-3 font-medium">{row.class}</td>
                  <td className="py-3 text-right">{row.precision.toFixed(1)}%</td>
                  <td className="py-3 text-right">{row.recall.toFixed(1)}%</td>
                  <td className="py-3 text-right">{row.f1.toFixed(1)}%</td>
                  <td className="py-3 text-right text-muted-foreground">{row.support}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// Utility Components

function MetricCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: any; color: string }) {
  const colorClasses = {
    success: "bg-success/10 text-success",
    primary: "bg-primary/10 text-primary",
    "primary-light": "bg-primary/10 text-primary",
    warning: "bg-warning/10 text-warning",
    orange: "bg-orange/10 text-orange",
  };

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className={`w-10 h-10 rounded-lg ${colorClasses[color as keyof typeof colorClasses]} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="text-2xl font-semibold mb-1">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <h3 className="font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );
}

function ConfigItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function MetricButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
        active ? "bg-primary text-primary-foreground" : "bg-card-highlight text-muted-foreground hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function DatasetCategory({ title, classes, icon: Icon }: { title: string; classes: any[]; icon: any }) {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <div className="flex items-center gap-2 mb-6">
        <Icon className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">{title}</h3>
      </div>
      <div className="space-y-4">
        {classes.map((cls) => (
          <div key={cls.name} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{cls.name}</span>
              <span className="text-muted-foreground">{cls.count} images</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full"
                style={{ width: `${cls.balance * 100}%` }}
              ></div>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${cls.status === "complete" ? "bg-success" : "bg-warning"}`}></div>
              <span className="text-xs text-muted-foreground capitalize">{cls.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RiskMetric({ label, value }: { label: string; value: number }) {
  const color = value > 70 ? "#EF4444" : value > 40 ? "#FACC15" : "#22C55E";

  return (
    <div>
      <div className="flex items-center justify-between text-sm mb-1">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold">{value}%</span>
      </div>
      <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${value}%`, backgroundColor: color }}
        ></div>
      </div>
    </div>
  );
}

function TimelineEvent({ time, title, desc, severity, isLast }: { time: string; title: string; desc: string; severity: string; isLast: boolean }) {
  const severityColors = {
    success: "bg-success",
    info: "bg-primary",
    warning: "bg-warning",
    danger: "bg-orange",
    critical: "bg-destructive",
  };

  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className={`w-3 h-3 rounded-full ${severityColors[severity as keyof typeof severityColors]} ring-4 ring-card-highlight flex-shrink-0`}></div>
        {!isLast && <div className="w-px h-full bg-border mt-2"></div>}
      </div>
      <div className="flex-1 pb-8">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-xs text-muted-foreground font-mono">{time}</span>
          <ChevronRight className="w-3 h-3 text-muted-foreground" />
          <span className="font-semibold">{title}</span>
        </div>
        <p className="text-sm text-muted-foreground">{desc}</p>
      </div>
    </div>
  );
}

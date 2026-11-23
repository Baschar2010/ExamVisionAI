import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, ArrowDownToLine, ArrowRight, BarChart3, Bot, Brain, Check, ChevronLeft,
  ChevronRight, ClipboardList, Clock3, Download, FileCheck2, FilePlus2, FileText,
  FileUp, FolderOpen, GitBranch, GraduationCap, Image as ImageIcon, LayoutDashboard, LineChart,
  ListChecks, MessageSquare, Network, PieChart, Presentation as PresentationIcon, Search, Send,
  Settings, ShieldCheck, Sparkles, Target, Trash2, Upload, Wand2
} from 'lucide-react';
import { evaluateAnswer, type Difficulty, type SourcePassage } from './core.ts';
import { localFeedback } from './grading.ts';
import { suggestQuestions } from './assistant.ts';
import { intentLabel, routeAssistant, type AssistantRouterLabels } from './assistant-router.ts';
import { buildLessonPlan, type LessonPlan } from './lesson.ts';
import { buildWorksheet, type Worksheet } from './worksheet.ts';
import { buildPresentation, type Presentation as PresentationModel } from './presentation.ts';
import { buildGraphic, type GraphicModel, type GraphicType } from './graphics.ts';
import { isRtlText, wrapText, type PdfBlock } from './pdf-layout.ts';
import { safeFilename } from './file-naming.ts';
import { saveBlobFile } from './native-io.ts';
import type { Artifact, ArtifactKind, ChatTurn, Doc, Profile, Q } from './types.ts';

type T = Record<string, any>;
export type StudioTool = ArtifactKind | 'assistant' | 'upload';
type Role = 'material' | 'template' | 'answers';

const TOOL_ICONS: Record<StudioTool, any> = {
  assistant: MessageSquare,
  lesson: ClipboardList,
  worksheet: FileText,
  practice: ListChecks,
  presentation: PresentationIcon,
  graphic: PieChart,
  upload: Upload
};

type DashboardProps = {
  p: Profile;
  t: T;
  learning: any;
  onNavigate: (page: string) => void;
  onStudio: (tool: StudioTool) => void;
  onAsk: (question: string) => void;
  onOpenArtifact: (artifact: Artifact) => void;
  onExportArtifact: (artifact: Artifact) => void;
};

export function Dashboard({ p, t, learning, onNavigate, onStudio, onAsk, onOpenArtifact, onExportArtifact }: DashboardProps) {
  const [query, setQuery] = useState('');
  const artifacts = useMemo(() => p.artifacts.slice().sort((a, b) => b.created.localeCompare(a.created)).slice(0, 4), [p.artifacts]);
  const materials = useMemo(() => p.docs.filter(doc => doc.role === 'material').slice(0, 4), [p.docs]);
  const exams = useMemo(() => p.exams.slice(0, 4), [p.exams]);
  const materialCount = p.docs.filter(doc => doc.role === 'material').length;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const question = query.trim();
    if (!question) return;
    onAsk(question);
    setQuery('');
  }

  const quick: Array<{ key: string; label: string; sub: string; icon: any; action: () => void; tone: string }> = [
    { key: 'exam', label: t.new, sub: t.newsub, icon: FilePlus2, tone: 'violet', action: () => onNavigate('create') },
    { key: 'assistant', label: t.toolAssistant, sub: t.assistantSub, icon: Bot, tone: 'blue', action: () => onStudio('assistant') },
    { key: 'lesson', label: t.toolLesson, sub: t.lessonSub, icon: ClipboardList, tone: 'mint', action: () => onStudio('lesson') },
    { key: 'worksheet', label: t.toolWorksheet, sub: t.worksheetSub, icon: FileText, tone: 'peach', action: () => onStudio('worksheet') },
    { key: 'practice', label: t.toolPractice, sub: t.practiceSub, icon: ListChecks, tone: 'violet', action: () => onStudio('practice') },
    { key: 'presentation', label: t.toolPresentation, sub: t.presentationSub, icon: PresentationIcon, tone: 'blue', action: () => onStudio('presentation') },
    { key: 'graphic', label: t.toolGraphics, sub: t.graphicsSub, icon: PieChart, tone: 'mint', action: () => onStudio('graphic') },
    { key: 'upload', label: t.toolUpload, sub: t.uploadSub, icon: Upload, tone: 'peach', action: () => onStudio('upload') },
    { key: 'correction', label: t.correction, sub: t.answerSheet, icon: FileCheck2, tone: 'violet', action: () => onNavigate('correction') },
    { key: 'progress', label: t.progress, sub: t.progressSub, icon: Activity, tone: 'blue', action: () => onNavigate('progress') }
  ];

  const artifactLabel: Record<ArtifactKind, string> = {
    lesson: t.artifactLesson,
    worksheet: t.artifactWorksheet,
    practice: t.artifactPractice,
    presentation: t.artifactPresentation,
    graphic: t.artifactGraphic
  };

  return <div className="dashboard">
    <section className="welcome-card">
      <div className="welcome-copy">
        <div className="eyebrow"><Sparkles size={14} /> {t.eyebrowHome}</div>
        <h1>{t.greeting}</h1>
        <p>{t.sub}</p>
        <form className="big-search" onSubmit={submit}>
          <Search size={20} />
          <input value={query} onChange={e => setQuery(e.target.value)} placeholder={t.dashSearch} aria-label={t.dashSearch} />
          <button className="btn primary" type="submit"><Send size={16} /> {t.ask}</button>
        </form>
        <small className="searchhint"><ShieldCheck size={14} /> {t.dashSearchHint}</small>
        <div className="welcome-actions">
          <button className="btn primary" onClick={() => onNavigate('create')}><FilePlus2 size={17} /> {t.new}</button>
          <button className="btn secondary" onClick={() => onStudio('assistant')}><Bot size={17} /> {t.toolAssistant}</button>
        </div>
      </div>
      <div className="welcome-visual" aria-hidden="true">
        <div className="visual-orb"><GraduationCap size={66} /></div>
        <span className="visual-chip chip-a"><FileCheck2 size={17} /> {materialCount} {t.files}</span>
        <span className="visual-chip chip-b"><Target size={17} /> {learning.percent}%</span>
        <span className="visual-chip chip-c"><Sparkles size={17} /> {p.artifacts.length}</span>
      </div>
    </section>

    <div className="statrow five">
      {[
        { icon: FileText, tone: 'violet', value: materialCount, label: t.files },
        { icon: LayoutDashboard, tone: 'blue', value: p.artifacts.length, label: t.recentContent },
        { icon: FileCheck2, tone: 'mint', value: p.exams.length, label: t.all },
        { icon: Clock3, tone: 'peach', value: `${p.minutes} ${t.minutesShort}`, label: t.minutesStudied },
        { icon: Activity, tone: 'violet', value: `${learning.percent}%`, label: t.avgScore }
      ].map((stat, i) => <div className="stat" key={i}>
        <span className={`staticon ${stat.tone}`}><stat.icon /></span>
        <div><b>{stat.value}</b><small>{stat.label}</small></div>
      </div>)}
    </div>

    <section className="section">
      <div className="sectionhead"><div><h2>{t.quickTools}</h2><p>{t.studioSub}</p></div>
        <button className="textbtn" onClick={() => onStudio('assistant')}>{t.allTools} <ArrowRight size={15} /></button>
      </div>
      <div className="quickgrid wide">
        {quick.map(item => <button className="quickcard" key={item.key} onClick={item.action}>
          <span className={`quickicon ${item.tone}`}><item.icon /></span>
          <span><b>{item.label}</b><small>{item.sub}</small></span>
          <ChevronRight />
        </button>)}
      </div>
    </section>

    <div className="dashboard-grid">
      <section className="section panel">
        <div className="sectionhead"><h2>{t.recentContent}</h2><button className="textbtn" onClick={() => onStudio('assistant')}>{t.allTools}</button></div>
        {artifacts.length === 0 ? <div className="miniempty"><Sparkles /> {t.noArtifacts}</div> :
          <div className="itemlist">{artifacts.map(a => <div className="itemrow" key={a.id}>
            <button className="itemmain" onClick={() => onOpenArtifact(a)}>
              <span className="itemicon violet">{React.createElement(TOOL_ICONS[a.kind], { size: 18 })}</span>
              <span><b>{a.title}</b><small>{artifactLabel[a.kind]} · {new Date(a.created).toLocaleDateString()}</small></span>
            </button>
            <button className="iconbtn" title={t.pdfDownload} aria-label={t.pdfDownload} onClick={() => onExportArtifact(a)}><ArrowDownToLine size={16} /></button>
            <ChevronRight size={16} />
          </div>)}</div>}
      </section>

      <section className="section panel">
        <div className="sectionhead"><h2>{t.savedMaterials}</h2><button className="textbtn" onClick={() => onNavigate('materials')}>{t.materials}</button></div>
        {materials.length === 0 ? <div className="miniempty"><FolderOpen /> {t.noData}</div> :
          <div className="itemlist">{materials.map(doc => <div className="itemrow" key={doc.id}>
            <span className="itemicon blue"><FileText size={18} /></span>
            <span><b>{doc.name}</b><small>{doc.pages} {t.pagesShort} · {Math.round(doc.quality * 100)}% {t.readability}</small></span>
          </div>)}</div>}
      </section>

      <section className="section panel">
        <div className="sectionhead"><h2>{t.learningSnapshot}</h2><button className="textbtn" onClick={() => onNavigate('progress')}>{t.progress}</button></div>
        {learning.topics.length === 0 ? <div className="miniempty"><Activity /> {t.noExamData}</div> :
          <div className="minibars">{learning.topics.slice(0, 5).map((topic: any) => <div className="minibarrow" key={topic.topic}>
            <span>{topic.topic}</span><div className="minibar"><i className={topic.percent < 60 ? 'low' : topic.percent >= 80 ? 'high' : ''} style={{ width: `${topic.percent}%` }} /></div><b>{topic.percent}%</b>
          </div>)}</div>}
      </section>

      <section className="section panel">
        <div className="sectionhead"><h2>{t.lastExams}</h2><button className="textbtn" onClick={() => onNavigate('all')}>{t.seeAll}</button></div>
        {exams.length === 0 ? <div className="miniempty"><FileCheck2 /> {t.empty}</div> :
          <div className="itemlist">{exams.map(exam => <button className="itemrow" key={exam.id} onClick={() => onNavigate('all')}>
            <span className="itemicon mint"><FileCheck2 size={18} /></span>
            <span><b>{exam.title}</b><small>{new Date(exam.created).toLocaleDateString()} · {exam.questions.length} {t.tasks}</small></span>
            {exam.submitted && <span className="scorechip">{exam.questions.reduce((sum, q) => sum + (q.earned || 0), 0)}/{exam.questions.reduce((sum, q) => sum + q.points, 0)}</span>}
          </button>)}</div>}
      </section>

      <section className="section panel">
        <h2>{t.personalStats}</h2>
        <div className="statsgrid">
          <div><b>{learning.submitted}</b><small>{t.submitted}</small></div>
          <div><b>{learning.percent}%</b><small>{t.avgScore}</small></div>
          <div><b>{learning.weakest.length}</b><small>{t.weak}</small></div>
          <div><b>{p.chat.length}</b><small>{t.toolAssistant}</small></div>
        </div>
      </section>

      <section className="section panel syncpanel">
        <h2>{t.syncTitle}</h2>
        <p className="muted">{t.syncText}</p>
        <button className="btn secondary" onClick={() => onNavigate('settings')}><Settings size={16} /> {t.exportData} / {t.importData}</button>
      </section>
    </div>
  </div>;
}

export type StudioProps = {
  p: Profile;
  t: T;
  tool: StudioTool;
  initialArtifact: Artifact | null;
  selected: string[];
  setSelected: React.Dispatch<React.SetStateAction<string[]>>;
  workPassages: SourcePassage[];
  allPassages: SourcePassage[];
  topics: string[];
  busy: boolean;
  progress: string;
  onUpload: (files: File[], role: Role) => void;
  onRemoveDoc: (id: string) => void;
  onAsk: (question: string) => void;
  onClearChat: () => void;
  onSaveArtifact: (artifact: Artifact) => void;
  onDeleteArtifact: (id: string) => void;
  onExamFromQuestions: (questions: Q[]) => void;
  onExportPdf: (blocks: PdfBlock[], filename: string) => void;
  onExportArtifact: (artifact: Artifact) => void;
  onError: (message: string) => void;
};

function esc(value: unknown): string {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function graphicDimensions(model: GraphicModel): { w: number; h: number } {
  const count = model.items.length;
  if (model.type === 'bar') return { w: 920, h: Math.max(330, 140 + count * 44) };
  if (model.type === 'timeline') return { w: 920, h: Math.max(330, 120 + count * 112) };
  if (model.type === 'flowchart') return { w: 920, h: Math.max(330, 120 + count * 118) };
  if (model.type === 'infographic') return { w: 920, h: 470 };
  return { w: 920, h: 430 };
}

export function graphicSvg(model: GraphicModel): string {
  const { w, h } = graphicDimensions(model);
  const colors = ['#6d5ce7', '#3b82f6', '#14b8a6', '#f59e0b', '#ec4899', '#8b5cf6', '#22c55e', '#6366f1'];
  const label = (text: string, x: number, y: number, size = 15, color = '#1e293b', weight = 500, anchor = 'start') =>
    `<text x="${x}" y="${y}" direction="${isRtlText(text) ? 'rtl' : 'ltr'}" text-anchor="${anchor}" font-family="Segoe UI,Arial,sans-serif" font-size="${size}" font-weight="${weight}" fill="${color}">${esc(text)}</text>`;
  const short = (text: string, max = 74) => text.length > max ? `${text.slice(0, max - 1)}…` : text;
  let body = '';

  if (model.type === 'bar') {
    const left = 190, right = 840, top = 104;
    model.items.forEach((item, i) => {
      const y = top + i * 44;
      const value = item.value || 0;
      const width = Math.max(4, (value / Math.max(1, model.scaleMax)) * (right - left));
      body += `${label(short(item.label, 22), 26, y + 17, 14)}${label(String(value), Math.min(right + 58, left + width + 42), y + 17, 13, '#475569', 600)}`;
      body += `<rect x="${left}" y="${y}" width="${right - left}" height="22" rx="11" fill="#eef2ff"/>`;
      body += `<rect x="${left}" y="${y}" width="${width}" height="22" rx="11" fill="${colors[i % colors.length]}"/>`;
    });
  } else if (model.type === 'timeline') {
    body += `<line x1="110" y1="92" x2="110" y2="${h - 52}" stroke="#c7d2fe" stroke-width="4"/>`;
    model.items.forEach((item, i) => {
      const y = 100 + i * 112;
      body += `<circle cx="110" cy="${y}" r="15" fill="${colors[i % colors.length]}"/>`;
      body += `${label(item.label, 110, y + 5, 13, '#ffffff', 700, 'middle')}`;
      body += `<rect x="148" y="${y - 34}" width="720" height="78" rx="16" fill="#f8fafc" stroke="#e2e8f0"/>`;
      body += `${label(short(item.detail || '', 36), 168, y - 10, 13, '#6d5ce7', 700)}`;
      body += `${label(short(item.text || '', 86), 168, y + 16, 14)}`;
    });
  } else if (model.type === 'comparison') {
    const cardW = 272;
    model.items.forEach((item, i) => {
      const x = 28 + i * (cardW + 16);
      body += `<rect x="${x}" y="104" width="${cardW}" height="272" rx="22" fill="#ffffff" stroke="#e2e8f0"/>`;
      body += `<rect x="${x}" y="104" width="${cardW}" height="8" rx="4" fill="${colors[i % colors.length]}"/>`;
      body += `${label(short(item.label, 26), x + 20, 146, 16, colors[i % colors.length], 700)}`;
      wrapText(item.text || '', 34).slice(0, 7).forEach((line, index) => {
        body += `${label(line, x + 20, 182 + index * 24, 13)}`;
      });
    });
  } else if (model.type === 'flowchart') {
    model.items.forEach((item, i) => {
      const y = 82 + i * 118;
      body += `<rect x="170" y="${y}" width="580" height="76" rx="18" fill="#f8fafc" stroke="#c7d2fe"/>`;
      body += `<circle cx="210" cy="${y + 38}" r="19" fill="${colors[i % colors.length]}"/>`;
      body += `${label(item.label, 210, y + 43, 13, '#ffffff', 700, 'middle')}`;
      body += `${label(short(item.detail || '', 30), 246, y + 28, 13, '#6d5ce7', 700)}`;
      body += `${label(short(item.text || '', 66), 246, y + 52, 13)}`;
      if (i < model.items.length - 1) body += `<path d="M460 ${y + 76} L460 ${y + 110}" stroke="#94a3b8" stroke-width="3"/><path d="M452 ${y + 102} L460 ${y + 112} L468 ${y + 102}" fill="none" stroke="#94a3b8" stroke-width="3"/>`;
    });
  } else {
    model.items.slice(0, 6).forEach((item, i) => {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 28 + col * 294, y = 106 + row * 156;
      body += `<rect x="${x}" y="${y}" width="274" height="136" rx="20" fill="#ffffff" stroke="#e2e8f0"/>`;
      body += `<rect x="${x}" y="${y}" width="274" height="8" rx="4" fill="${colors[i % colors.length]}"/>`;
      body += `${label(short(item.label, 24), x + 20, y + 44, 14, colors[i % colors.length], 700)}`;
      if (item.value !== undefined) body += `${label(String(item.value), x + 20, y + 100, 40, '#0f172a', 800)}`;
      if (item.text) wrapText(item.text, 30).slice(0, 3).forEach((line, index) => {
        body += `${label(short(line, 30), x + 20, y + 88 + index * 18, 12)}`;
      });
    });
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}" role="img" aria-label="${esc(model.title)}">
    <rect width="${w}" height="${h}" rx="26" fill="#f8fafc"/>
    <rect x="0" y="0" width="${w}" height="82" rx="26" fill="#eef2ff"/>
    <rect x="0" y="56" width="${w}" height="26" fill="#eef2ff"/>
    ${label(short(model.title, 52), 28, 40, 22, '#312e81', 800)}
    ${label(short(model.subtitle, 64), 28, 68, 13, '#6366f1', 600)}
    ${body}
    ${label(short(model.footer, 70), 28, h - 18, 12, '#94a3b8', 500)}
  </svg>`;
}

function downloadBlob(blob: Blob, filename: string, dialogTitle = 'Datei teilen oder öffnen') {
  void saveBlobFile(blob, filename, { dialogTitle });
}

export function Studio(props: StudioProps) {
  const {
    p, t, tool, initialArtifact, selected, setSelected, workPassages, allPassages, topics,
    busy, progress, onUpload, onRemoveDoc, onAsk, onClearChat, onSaveArtifact,
    onDeleteArtifact, onExamFromQuestions, onExportPdf, onExportArtifact, onError
  } = props;

  const [active, setActive] = useState<StudioTool>(tool);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState(p.exams[0]?.subject || '');
  const [topic, setTopic] = useState('');
  const [lang, setLang] = useState(p.lang);
  const [minutes, setMinutes] = useState(45);
  const [objectives, setObjectives] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [form, setForm] = useState(t.formFrontal);
  const [lesson, setLesson] = useState<LessonPlan | null>(null);
  const [sheet, setSheet] = useState<Worksheet | null>(null);
  const [sheetCount, setSheetCount] = useState(5);
  const [sheetTitle, setSheetTitle] = useState('');
  const [sheetInstructions, setSheetInstructions] = useState('');
  const [showSolutions, setShowSolutions] = useState(true);
  const [practice, setPractice] = useState<Worksheet | null>(null);
  const [practiceCount, setPracticeCount] = useState(4);
  const [responses, setResponses] = useState<Record<string, string>>({});
  const [results, setResults] = useState<Record<string, { points: number; feedback: string }>>({});
  const [deck, setDeck] = useState<PresentationModel | null>(null);
  const [slide, setSlide] = useState(0);
  const [graphicType, setGraphicType] = useState<GraphicType>('bar');
  const [graphic, setGraphic] = useState<GraphicModel | null>(null);
  const [chatInput, setChatInput] = useState('');
  const [uploadRole, setUploadRole] = useState<Role>('material');
  const uploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialArtifact) {
      loadArtifact(initialArtifact);
    } else {
      setActive(tool);
    }
    // Parent controls tool changes; loading is intentionally keyed to the selected artifact.
  }, [tool, initialArtifact]);

  function loadArtifact(a: Artifact) {
    setActive(a.kind);
    setSubject(a.subject || '');
    setTopic(a.topic || '');
    setLang(a.lang || p.lang);
    if (a.kind === 'lesson') setLesson(a.data as LessonPlan);
    if (a.kind === 'worksheet') { setSheet(a.data as Worksheet); setShowSolutions(Boolean((a.data as Worksheet).showSolutions)); }
    if (a.kind === 'practice') { setPractice(a.data as Worksheet); setResponses({}); setResults({}); }
    if (a.kind === 'presentation') { setDeck(a.data as PresentationModel); setSlide(0); }
    if (a.kind === 'graphic') { setGraphic(a.data as GraphicModel); setGraphicType((a.data as GraphicModel).type); }
    setMessage('');
  }

  function save(kind: ArtifactKind, title: string, data: unknown) {
    const artifact: Artifact = {
      id: crypto.randomUUID(), kind, title, subject, topic,
      created: new Date().toISOString(), lang, data
    };
    onSaveArtifact(artifact);
    setMessage(t.artifactSaved);
  }

  function requirePassages(): SourcePassage[] {
    if (!workPassages.length) {
      onError(t.noMaterial);
      return [];
    }
    return workPassages;
  }

  const toolList: Array<{ key: StudioTool; sub: string }> = [
    { key: 'assistant', sub: t.assistantSub },
    { key: 'lesson', sub: t.lessonSub },
    { key: 'worksheet', sub: t.worksheetSub },
    { key: 'practice', sub: t.practiceSub },
    { key: 'presentation', sub: t.presentationSub },
    { key: 'graphic', sub: t.graphicsSub },
    { key: 'upload', sub: t.uploadSub }
  ];

  function artifactLines(items: Artifact[]) {
    return items.slice().sort((a, b) => b.created.localeCompare(a.created)).slice(0, 5);
  }

  const selectedDocs = p.docs.filter(doc => doc.role === 'material');
  const toolTitles: Record<StudioTool, string> = {
    assistant: t.toolAssistant, lesson: t.toolLesson, worksheet: t.toolWorksheet,
    practice: t.toolPractice, presentation: t.toolPresentation, graphic: t.toolGraphics, upload: t.toolUpload
  };
  const toolSubs: Record<StudioTool, string> = {
    assistant: t.assistantSub, lesson: t.lessonSub, worksheet: t.worksheetSub,
    practice: t.practiceSub, presentation: t.presentationSub, graphic: t.graphicsSub, upload: t.uploadSub
  };

  function triggerUpload(role: Role) {
    setUploadRole(role);
    setTimeout(() => uploadRef.current?.click(), 0);
  }

  function ask(e?: React.FormEvent) {
    e?.preventDefault();
    const question = chatInput.trim();
    if (!question) return;
    onAsk(question);
    setChatInput('');
  }

  function makeLesson() {
    const passages = requirePassages();
    if (!passages.length) return;
    const plan = buildLessonPlan({
      subject, topic, language: lang, minutes, objectives,
      difficulty, form, passages,
      labels: {
        draftTitle: t.draftTitle, subject: t.subject, topic: t.topic, language: t.language,
        duration: t.duration, difficulty: t.difficulty, form: t.form, objectives: t.objectives,
        phases: t.phases, phaseWarmup: t.phaseWarmup, phaseInput: t.phaseInput,
        phasePractice: t.phasePractice, phaseClosure: t.phaseClosure, teacher: t.teacher,
        students: t.students, materials: t.materials, differentiation: t.differentiation,
        assessment: t.assessment, sources: t.sources, defaultObjective: t.defaultObjective,
        easy: t.easy, medium: t.medium, hard: t.hard
      }
    });
    setLesson(plan);
    save('lesson', plan.title, plan);
  }

  function makeWorksheet() {
    const passages = requirePassages();
    if (!passages.length) return;
    const result = buildWorksheet(passages, {
      title: sheetTitle || topic || t.toolWorksheet, instructions: sheetInstructions, topic,
      difficulty, count: sheetCount, showSolutions, language: lang, unknownTopic: t.unknownTopic
    });
    setSheet(result);
    save('worksheet', result.title, result);
  }

  function makePractice() {
    const passages = requirePassages();
    if (!passages.length) return;
    const result = buildWorksheet(passages, {
      title: `${t.toolPractice}${topic ? `: ${topic}` : ''}`, instructions: t.practiceIntro, topic,
      difficulty, count: practiceCount, showSolutions: false, language: lang, unknownTopic: t.unknownTopic
    });
    if (!result.questions.length) { onError(t.noText); return; }
    setPractice(result);
    setResponses({});
    setResults({});
    save('practice', result.title, result);
  }

  function checkPractice() {
    if (!practice) return;
    const next: Record<string, { points: number; feedback: string }> = {};
    for (const question of practice.questions) {
      const response = responses[question.id] || '';
      const result = evaluateAnswer(question.answer, response, question.points);
      next[question.id] = { points: result.points, feedback: localFeedback(result, response, t as any) };
    }
    setResults(next);
  }

  function makePresentation() {
    const passages = requirePassages();
    if (!passages.length) return;
    const result = buildPresentation(passages, {
      topic: topic || t.fallbackTitle, subject: subject || t.fallbackSubject, objectives,
      difficulty, language: lang,
      labels: {
        titlePrefix: t.toolPresentation, objective: t.objectives, concept: t.concept,
        application: t.application, summary: t.summary, source: t.source,
        teacherNote: t.teacherNote, defaultObjective: t.defaultObjective
      }
    });
    setDeck(result);
    setSlide(0);
    save('presentation', result.title, result);
  }

  function makeGraphic() {
    const passages = requirePassages();
    if (!passages.length) return;
    const result = buildGraphic(passages, {
      type: graphicType, topic,
      labels: {
        bar: t.bar, timeline: t.timeline, comparison: t.comparison, flowchart: t.flowchart,
        infographic: t.infographic, concepts: t.concepts, passages: t.passages, sources: t.sourcesGraphic,
        words: t.words, shared: t.shared, onlyTopic: t.onlyTopic, onlyOther: t.onlyOther,
        step: t.step, noData: t.noData, average: t.average
      }
    });
    setGraphic(result);
    save('graphic', `${result.title}${topic ? `: ${topic}` : ''}`, result);
  }

  function exportCurrent(kind: ArtifactKind, title: string, data: unknown) {
    const artifact: Artifact = {
      id: 'preview', kind, title, subject, topic,
      created: new Date().toISOString(), lang, data
    };
    onExportArtifact(artifact);
  }

  async function exportGraphicPng() {
    if (!graphic) return;
    const { w, h } = graphicDimensions(graphic);
    const url = URL.createObjectURL(new Blob([graphicSvg(graphic)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const image = new Image();
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = () => reject(new Error('svg render failed'));
        image.src = url;
      });
      const canvas = document.createElement('canvas');
      canvas.width = w * 2;
      canvas.height = h * 2;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(2, 2);
      ctx.drawImage(image, 0, 0);
      const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
      if (blob) downloadBlob(blob, `${safeFilename(graphic.title)}.png`, t.shareFile);
    } catch (error) {
      onError(error instanceof Error ? error.message : String(error));
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  const art = artifactLines(p.artifacts);
  const assistantLabels: AssistantRouterLabels = {
    noDocs: t.assistantNoDocs, noMatch: t.assistantNoMatch,
    answerPrefix: t.assistantPrefix, sourcePrefix: t.sourcePrefix, suggestedPrefix: t.suggestions,
    modeConversation: t.modeConversation, modeGeneral: t.modeGeneral, modeMaterial: t.modeMaterial,
    modeExam: t.modeExam, modePractice: t.modePractice, modeCorrection: t.modeCorrection,
    chatHello: t.chatHello, chatMorning: t.chatMorning, chatHowAreYou: t.chatHowAreYou,
    chatThanks: t.chatThanks, chatBye: t.chatBye, chatWho: t.chatWho, chatHelp: t.chatHelp,
    chatCapabilities: t.chatCapabilities, generalPrefix: t.generalPrefix, generalFallback: t.generalFallback,
    guideMaterial: t.guideMaterial, guideExam: t.guideExam, guidePractice: t.guidePractice,
    guideCorrection: t.guideCorrection
  };
  const suggestions = suggestQuestions(allPassages, assistantLabels);

  return <div className="studio">
    <aside className="studio-sidebar">
      <div className="studio-side-title"><Sparkles size={16} /> {t.studio}</div>
      <div className="studio-tools">
        {toolList.map(item => {
          const Icon = TOOL_ICONS[item.key];
          return <button key={item.key} className={`studio-tool ${active === item.key ? 'active' : ''}`} onClick={() => { setActive(item.key); setMessage(''); }}>
            <Icon size={19} /><span><b>{toolTitles[item.key]}</b><small>{item.sub}</small></span>
          </button>;
        })}
      </div>
      {art.length > 0 && <div className="studio-artifacts">
        <div className="navlabel">{t.recentContent}</div>
        {art.map(a => <div key={a.id} className="studio-artifact">
          <button className="studio-artifact-main" onClick={() => loadArtifact(a)}>
            {React.createElement(TOOL_ICONS[a.kind], { size: 15 })}<span>{a.title}</span>
          </button>
          <button className="studio-artifact-action" title={t.pdfDownload} aria-label={t.pdfDownload} onClick={() => onExportArtifact(a)}><ArrowDownToLine size={14} /></button>
          <button className="studio-artifact-action danger" title={t.deleteArtifact} aria-label={t.deleteArtifact} onClick={() => onDeleteArtifact(a.id)}><Trash2 size={14} /></button>
        </div>)}
      </div>}
    </aside>

    <section className="studio-work">
      <div className="studio-head"><div><div className="eyebrow"><Sparkles size={14} /> EXAMVISION AI</div>
        <h1>{toolTitles[active]}</h1><p>{toolSubs[active]}</p></div>
        <span className={`localpill ${active === 'assistant' ? '' : 'neutral'}`}><ShieldCheck size={15} /> {t.assistantLocal}</span>
      </div>
      {message && <div className="successline"><Check size={16} /> {message}</div>}
      {busy && <div className="processing"><span className="spinner" /> {progress}</div>}

      {active === 'assistant' && <div className="studio-grid">
        <div className="workcard chatcard">
          <h2>{t.assistantIntro}</h2>
          <div className="chatlist">
            {p.chat.length === 0 ? <div className="miniempty"><Bot /> {t.assistantEmpty}</div> : p.chat.map(turn =>
              <article className={`chatbubble ${turn.mode === 'ai' ? 'remote' : ''}`} key={turn.id}>
                <span className="chatwho">{t.ask}</span><p>{turn.question}</p>
                <div className="chatanswer"><span className="chatwho">{t.assistantLocal}</span>
                  {turn.intent && <span className={`intentchip intent-${turn.intent}`}>{intentLabel(turn.intent, assistantLabels)}</span>}
                  <p>{turn.answer}</p>
                  {turn.sources.length > 0 && <small>{t.assistantSources}: {turn.sources.join(', ')}</small>}
                </div>
              </article>)}
          </div>
          <form className="chatinput" onSubmit={ask}>
            <textarea rows={3} value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder={t.assistantPlaceholder} />
            <div className="btnrow"><button className="btn primary" type="submit" disabled={!chatInput.trim()}><Send size={16} /> {t.ask}</button>
              <button className="btn secondary" type="button" onClick={onClearChat}><Trash2 size={16} /> {t.clearChat}</button></div>
          </form>
        </div>
        <div className="sidecard">
          <h3>{t.suggestions}</h3>
          <div className="suggestions">{suggestions.length ? suggestions.map((item, i) => <button key={i} onClick={() => { setChatInput(item.replace(t.suggestions, '').replace(/^[\s„“"']+|[\s“"']+$/g, '')); }}>{item}</button>) : <p className="muted">{t.assistantNoDocs}</p>}</div>
          <div className="tip"><ShieldCheck size={16} /> {t.dashSearchHint}</div>
          <h3>{t.savedMaterials}</h3>
          <p className="muted">{p.docs.filter(doc => doc.role === 'material').length} {t.files}</p>
        </div>
      </div>}

      {active === 'lesson' && <div className="studio-grid">
        <div className="workcard formstack">
          <div className="twofields"><label><span className="fieldlabel">{t.subject}</span><input value={subject} onChange={e => setSubject(e.target.value)} placeholder={t.fallbackSubject} /></label>
            <label><span className="fieldlabel">{t.language}</span><select value={lang} onChange={e => setLang(e.target.value)}>
              {[['de', 'Deutsch'], ['en', 'English'], ['ar', 'العربية'], ['fr', 'Français'], ['es', 'Español']].map(([value, name]) => <option key={value} value={value}>{name}</option>)}
            </select></label></div>
          <label><span className="fieldlabel">{t.topic}</span><input list="studio-topics" value={topic} onChange={e => setTopic(e.target.value)} placeholder={t.fallbackTitle} />
            <datalist id="studio-topics">{topics.map(x => <option key={x} value={x} />)}</datalist></label>
          <div className="twofields"><label><span className="fieldlabel">{t.duration}</span><input type="number" min={20} max={180} value={minutes} onChange={e => setMinutes(Math.max(20, Math.min(180, +e.target.value || 45)))} /></label>
            <label><span className="fieldlabel">{t.form}</span><select value={form} onChange={e => setForm(e.target.value)}>
              {[t.formFrontal, t.formGroup, t.formProject, t.formStation].map(x => <option key={x}>{x}</option>)}
            </select></label></div>
          <label><span className="fieldlabel">{t.objectives}</span><textarea rows={3} value={objectives} onChange={e => setObjectives(e.target.value)} placeholder={t.objectivePlaceholder} /></label>
          <div><span className="fieldlabel">{t.difficulty}</span><div className="segmented">
            {([['easy', t.easy], ['medium', t.medium], ['hard', t.hard]] as Array<[Difficulty, string]>).map(([value, name]) =>
              <button key={value} className={difficulty === value ? 'chosen' : ''} onClick={() => setDifficulty(value)}>{name}</button>)}
          </div></div>
          <MaterialPicker t={t} docs={selectedDocs} selected={selected} setSelected={setSelected} />
          <button className="btn primary wide" onClick={makeLesson}><Wand2 size={17} /> {t.generateLesson}</button>
        </div>
        <div className="workcard previewcard">
          {lesson ? <>
            <div className="previewhead"><h2>{lesson.title}</h2><button className="btn secondary" onClick={() => exportCurrent('lesson', lesson.title, lesson)}><ArrowDownToLine size={16} /> {t.pdfDownload}</button></div>
            <div className="metarow">{lesson.meta.map(item => <span key={item.label}><b>{item.label}:</b> {item.value}</span>)}</div>
            <h3>{t.objectives}</h3><ul>{lesson.objectives.map((x, i) => <li key={i}>{x}</li>)}</ul>
            {lesson.phases.map((phase, i) => <article className="phase" key={i}>
              <header><b>{i + 1}. {phase.name}</b><span>{phase.minutes} {t.minutesShort}</span></header>
              <p>{phase.activity}</p><small>{phase.teacher} · {phase.students}</small>
              <small>{t.materials}: {phase.material}</small>
            </article>)}
            <div className="tip"><ShieldCheck size={16} /> {t.groundText}</div>
          </> : <div className="miniempty"><ClipboardList /> {t.lessonSub}</div>}
        </div>
      </div>}

      {active === 'worksheet' && <div className="studio-grid">
        <div className="workcard formstack">
          <label><span className="fieldlabel">{t.worksheetTitle}</span><input value={sheetTitle} onChange={e => setSheetTitle(e.target.value)} placeholder={t.toolWorksheet} /></label>
          <label><span className="fieldlabel">{t.topic}</span><input list="studio-topics" value={topic} onChange={e => setTopic(e.target.value)} /></label>
          <label><span className="fieldlabel">{t.worksheetInstructions}</span><textarea rows={2} value={sheetInstructions} onChange={e => setSheetInstructions(e.target.value)} /></label>
          <div className="twofields"><label><span className="fieldlabel">{t.difficulty}</span><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
            {[['easy', t.easy], ['medium', t.medium], ['hard', t.hard]].map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select></label><label><span className="fieldlabel">{t.count}</span><select value={sheetCount} onChange={e => setSheetCount(+e.target.value)}>
            {[1, 3, 5, 8, 10, 12].map(x => <option key={x}>{x}</option>)}</select></label></div>
          <MaterialPicker t={t} docs={selectedDocs} selected={selected} setSelected={setSelected} />
          <label className="checkline"><input type="checkbox" checked={showSolutions} onChange={e => setShowSolutions(e.target.checked)} /><span>{t.includeSolutions}</span></label>
          <button className="btn primary wide" onClick={makeWorksheet}><FileText size={17} /> {t.generateWorksheet}</button>
        </div>
        <div className="workcard previewcard">
          {sheet ? <>
            <div className="previewhead"><h2>{sheet.title}</h2><button className="btn secondary" onClick={() => exportCurrent('worksheet', sheet.title, sheet)}><ArrowDownToLine size={16} /> {t.pdfDownload}</button></div>
            <p className="muted">{sheet.instructions} · {sheet.showSolutions ? t.solutionsShown : t.solutionsHidden}</p>
            {sheet.questions.map((question, i) => <article className="sheetquestion" key={question.id}>
              <header><b>{i + 1}. {question.prompt}</b><span>{question.points}</span></header>
              {sheet.showSolutions && <p><b>{t.solution}:</b> {question.answer}</p>}
              <small>{t.source}: {question.source}</small>
            </article>)}
            <button className="btn secondary wide" onClick={() => onExamFromQuestions(sheet.questions.map(q => ({ ...q, response: '' })))}><FileCheck2 size={16} /> {t.openAsExam}</button>
          </> : <div className="miniempty"><FileText /> {t.worksheetEmpty}</div>}
        </div>
      </div>}

      {active === 'practice' && <div className="studio-grid">
        <div className="workcard formstack">
          <p className="muted">{t.practiceIntro}</p>
          <label><span className="fieldlabel">{t.topic}</span><input list="studio-topics" value={topic} onChange={e => setTopic(e.target.value)} /></label>
          <div className="twofields"><label><span className="fieldlabel">{t.difficulty}</span><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
            {[['easy', t.easy], ['medium', t.medium], ['hard', t.hard]].map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select></label><label><span className="fieldlabel">{t.count}</span><select value={practiceCount} onChange={e => setPracticeCount(+e.target.value)}>
            {[2, 3, 4, 5, 8].map(x => <option key={x}>{x}</option>)}</select></label></div>
          <MaterialPicker t={t} docs={selectedDocs} selected={selected} setSelected={setSelected} />
          <button className="btn primary wide" onClick={makePractice}><ListChecks size={17} /> {t.practiceAgain}</button>
        </div>
        <div className="workcard previewcard">
          {practice ? <>
            <div className="previewhead"><h2>{practice.title}</h2><button className="btn secondary" onClick={checkPractice}><Check size={16} /> {t.practiceCheck}</button></div>
            {practice.questions.map((question, i) => {
              const result = results[question.id];
              return <article className="sheetquestion" key={question.id}>
                <header><b>{i + 1}. {question.prompt}</b><span>{question.points}</span></header>
                <textarea rows={2} value={responses[question.id] || ''} onChange={e => setResponses(x => ({ ...x, [question.id]: e.target.value }))} />
                {result && <p className={result.points === question.points ? 'ok' : 'partial'}><b>{t.practiceScore}: {result.points}/{question.points}</b> · {result.feedback}</p>}
                {result && result.points < question.points && <p><button className="textbtn" onClick={() => setResponses(x => ({ ...x, [question.id]: question.answer }))}>{t.revealSolution}</button></p>}
              </article>;
            })}
            <button className="btn secondary wide" onClick={() => exportCurrent('practice', practice.title, practice)}><ArrowDownToLine size={16} /> {t.pdfDownload}</button>
          </> : <div className="miniempty"><Brain /> {t.practiceSub}</div>}
        </div>
      </div>}

      {active === 'presentation' && <div className="studio-grid">
        <div className="workcard formstack">
          <label><span className="fieldlabel">{t.subject}</span><input value={subject} onChange={e => setSubject(e.target.value)} /></label>
          <label><span className="fieldlabel">{t.topic}</span><input list="studio-topics" value={topic} onChange={e => setTopic(e.target.value)} /></label>
          <label><span className="fieldlabel">{t.objectives}</span><textarea rows={3} value={objectives} onChange={e => setObjectives(e.target.value)} /></label>
          <div className="twofields"><label><span className="fieldlabel">{t.difficulty}</span><select value={difficulty} onChange={e => setDifficulty(e.target.value as Difficulty)}>
            {[['easy', t.easy], ['medium', t.medium], ['hard', t.hard]].map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select></label><label><span className="fieldlabel">{t.language}</span><select value={lang} onChange={e => setLang(e.target.value)}>
            {[['de', 'Deutsch'], ['en', 'English'], ['ar', 'العربية'], ['fr', 'Français'], ['es', 'Español']].map(([value, name]) => <option key={value} value={value}>{name}</option>)}
          </select></label></div>
          <MaterialPicker t={t} docs={selectedDocs} selected={selected} setSelected={setSelected} />
          <button className="btn primary wide" onClick={makePresentation}><PresentationIcon size={17} /> {t.generateLesson}</button>
        </div>
        <div className="workcard previewcard">
          {deck ? <>
            <div className="previewhead"><h2>{t.slide} {slide + 1} / {deck.slides.length}</h2>
              <button className="btn secondary" onClick={() => exportCurrent('presentation', deck.title, deck)}><ArrowDownToLine size={16} /> {t.pdfDownload}</button></div>
            <article className="slidepreview">
              <span className="eyebrow">{deck.slides[slide].kind}</span>
              <h2>{deck.slides[slide].title}</h2>
              <ul>{deck.slides[slide].bullets.map((bullet, i) => <li key={i}>{bullet}</li>)}</ul>
              <small>{t.slideNotes}: {deck.slides[slide].note}</small>
              {deck.slides[slide].source && <small>{t.source}: {deck.slides[slide].source}</small>}
            </article>
            <div className="btnrow"><button className="btn secondary" disabled={slide === 0} onClick={() => setSlide(x => x - 1)}><ChevronLeft size={16} /> {t.prevSlide}</button>
              <button className="btn secondary" disabled={slide >= deck.slides.length - 1} onClick={() => setSlide(x => x + 1)}>{t.nextSlide} <ChevronRight size={16} /></button></div>
          </> : <div className="miniempty"><PresentationIcon /> {t.presentationIntro}</div>}
        </div>
      </div>}

      {active === 'graphic' && <div className="studio-grid">
        <div className="workcard formstack">
          <p className="muted">{t.graphicIntro}</p>
          <label><span className="fieldlabel">{t.graphicType}</span><select value={graphicType} onChange={e => setGraphicType(e.target.value as GraphicType)}>
            {([['bar', t.bar], ['timeline', t.timeline], ['comparison', t.comparison], ['flowchart', t.flowchart], ['infographic', t.infographic]] as Array<[GraphicType, string]>).map(([value, name]) =>
              <option key={value} value={value}>{name}</option>)}
          </select></label>
          <label><span className="fieldlabel">{t.topic}</span><input list="studio-topics" value={topic} onChange={e => setTopic(e.target.value)} /></label>
          <MaterialPicker t={t} docs={selectedDocs} selected={selected} setSelected={setSelected} />
          <button className="btn primary wide" onClick={makeGraphic}><BarChart3 size={17} /> {t.generateGraphic}</button>
        </div>
        <div className="workcard previewcard">
          {graphic ? <>
            <div className="previewhead"><h2>{graphic.title}</h2><div className="btnrow">
              <button className="btn secondary" onClick={() => downloadBlob(new Blob([graphicSvg(graphic)], { type: 'image/svg+xml;charset=utf-8' }), `${safeFilename(graphic.title)}.svg`, t.shareFile)}><Download size={16} /> {t.exportSvg}</button>
              <button className="btn secondary" onClick={() => void exportGraphicPng()}><ImageIcon size={16} /> {t.exportPng}</button>
              <button className="btn secondary" onClick={() => exportCurrent('graphic', graphic.title, graphic)}><ArrowDownToLine size={16} /> {t.pdfDownload}</button>
            </div></div>
            <div className="graphicframe" dangerouslySetInnerHTML={{ __html: graphicSvg(graphic) }} />
          </> : <div className="miniempty"><Network /> {t.graphicsSub}</div>}
        </div>
      </div>}

      {active === 'upload' && <div className="studio-grid">
        <div className="workcard">
          <div className="uploadgrid compact">
            {([['material', t.material, t.uploadHint, Upload], ['template', t.oldPaper, t.templateHint, FileCheck2], ['answers', t.answerSheet, t.answerHint, FileText]] as Array<[Role, string, string, any]>).map(([role, title, sub, Icon]) =>
              <button className={`uploadtile ${uploadRole === role ? 'selected' : ''}`} key={role} onClick={() => triggerUpload(role)}>
                <span className="uploadicon violet"><Icon /></span><b>{title}</b><small>{sub}</small>
                <span className="tilecta">{t.upload} <Upload size={15} /></span>
              </button>)}
          </div>
          <input ref={uploadRef} hidden type="file" accept="application/pdf,image/jpeg,image/png" multiple={uploadRole !== 'template'}
            onChange={e => { onUpload(Array.from(e.target.files || []), uploadRole); e.currentTarget.value = ''; }} />
          {busy && <div className="processing"><span className="spinner" /> {progress}</div>}
          {progress && !busy && <div className="successline"><Check size={16} /> {progress}</div>}
        </div>
        <div className="workcard previewcard">
          <div className="sectionhead"><h2>{t.files} <span className="countpill">{p.docs.length}</span></h2></div>
          {p.docs.length === 0 ? <div className="miniempty"><FileUp /> {t.noData}</div> : <div className="itemlist">{p.docs.map(doc =>
            <div className="itemrow" key={doc.id}>
              <span className="itemicon blue">{doc.type === 'application/pdf' ? <FileText size={18} /> : <ImageIcon size={18} />}</span>
              <span><b>{doc.name}</b><small>{doc.role === 'material' ? t.material : doc.role === 'template' ? t.oldPaper : t.answerSheet} · {doc.pages} {t.pagesShort} · {Math.round(doc.quality * 100)}% {t.readability}</small>
                {(doc.ocrWarnings?.length || 0) > 0 && <small className="warning">{t.unreadablePages}: {doc.ocrWarnings!.join(', ')}</small>}</span>
              <button className="iconbtn danger" title={t.deleteFile} onClick={() => onRemoveDoc(doc.id)}><Trash2 size={16} /></button>
            </div>)}</div>}
        </div>
      </div>}
    </section>
  </div>;
}

function MaterialPicker({ t, docs, selected, setSelected }: { t: T; docs: Doc[]; selected: string[]; setSelected: React.Dispatch<React.SetStateAction<string[]>> }) {
  if (!docs.length) return <div className="inlineempty"><FileText /> {t.noMaterial}</div>;
  return <div><span className="fieldlabel">{t.choose}</span><div className="selectdocs compact">
    {docs.map(doc => <label className="selectdoc" key={doc.id}>
      <input type="checkbox" checked={selected.includes(doc.id)} onChange={e => setSelected(x => e.target.checked ? [...x, doc.id] : x.filter(id => id !== doc.id))} />
      <FileText size={17} /><span><b>{doc.name}</b><small>{Math.round(doc.quality * 100)}% {t.readability}</small></span>
    </label>)}
  </div></div>;
}

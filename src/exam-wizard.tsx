import React, { useMemo, useRef, useState } from 'react';
import {
  ArrowLeft, ArrowRight, Check, FileText, Globe2, Lightbulb,
  Plus, ShieldCheck, Sparkles, Trash2, Upload, X
} from 'lucide-react';
import { textParts, topicOf, type SourcePassage } from './core.ts';
import {
  DIDACTIC_TEMPLATES, FORMAT_BY_ID, OPERATORS, REQUIREMENT_LEVELS, TASK_FORMATS,
  buildCreation, configFromExam, defaultBlocks, defaultConfig, inferFormats,
  makeChoiceOptions, newBlock, passagesFromText, reorderBlocks, reorderQuestions,
  suggestObjectives, topicOnlyPassages, validateCreation
} from './creation.ts';
import { requestStructured, validateAiConfig, validateQuestions, type AiQuestion } from './ai-provider.ts';
import type { CreationConfig, Doc, Exam, Profile, Q } from './types.ts';

type T = Record<string, any>;
export type WizardAction = 'save' | 'start' | 'student' | 'solution';

export type ExamWizardProps = {
  t: T;
  p: Profile;
  docs: Doc[];
  config: CreationConfig;
  setConfig: React.Dispatch<React.SetStateAction<CreationConfig>>;
  initialExam: Exam | null;
  busy: boolean;
  onUpload: (files: File[], role: 'material' | 'template') => void;
  onError: (message: string) => void;
  onCreate: (config: CreationConfig, questions: Q[], action: WizardAction) => void;
  onCancel: () => void;
};

const LANGUAGES: Array<[string, string]> = [['de', 'Deutsch'], ['en', 'English'], ['ar', 'العربية'], ['fr', 'Français'], ['es', 'Español']];
const GRADES = ['5', '6', '7', '8', '9', '10', '11', '12', '13'];
const SOURCE_MODES: Array<[CreationConfig['sourceMode'], string]> = [
  ['materials', 'wizSourceMaterials'], ['text', 'wizSourceText'], ['topic', 'wizSourceTopic'], ['mixed', 'wizSourceMixed']
];
const EXAM_KINDS: Array<[CreationConfig['examKind'], string]> = [
  ['classwork', 'wizKindClasswork'], ['test', 'wizKindTest'], ['practice', 'wizKindPractice'], ['worksheet', 'wizKindWorksheet']
];
const DIFFERENTIATIONS: Array<[CreationConfig['differentiation'], string]> = [
  ['foundation', 'wizDiffFoundation'], ['regular', 'wizDiffRegular'], ['support', 'wizDiffSupport'], ['mixed', 'wizDiffMixed']
];

export function formatLabel(formatId: string, t: T): string {
  const format = FORMAT_BY_ID.get(formatId);
  if (!format) return formatId;
  return t[format.labelKey] || format.defaultLabel;
}

export function operatorLabel(operatorId: string, t: T): string {
  const operator = OPERATORS.find(item => item.id === operatorId);
  return operator ? (t[operator.labelKey] || operator.defaultLabel) : operatorId;
}

function requirementLabel(level: string, t: T): string {
  const entry = REQUIREMENT_LEVELS.find(item => item.id === level);
  return entry ? (t[entry.labelKey] || entry.defaultLabel) : level;
}

export function ExamWizard(props: ExamWizardProps) {
  const { t, p, docs, config, setConfig, initialExam, busy, onUpload, onError, onCreate, onCancel } = props;
  const [step, setStep] = useState(1);
  const [questions, setQuestions] = useState<Q[]>(initialExam ? initialExam.questions : []);
  const [objectiveDraft, setObjectiveDraft] = useState('');
  const [templateQuery, setTemplateQuery] = useState('');
  const [templateSubject, setTemplateSubject] = useState('');
  const [templateKind, setTemplateKind] = useState('');
  const [templateLevel, setTemplateLevel] = useState('');
  const [aiPayload, setAiPayload] = useState('');
  const [aiPreview, setAiPreview] = useState('');
  const [aiConsent, setAiConsent] = useState(false);
  const [aiBusy, setAiBusy] = useState(false);
  const [aiQuestions, setAiQuestions] = useState<Q[]>([]);
  const materialInput = useRef<HTMLInputElement>(null);
  const templateInput = useRef<HTMLInputElement>(null);
  const aiConfigured = Boolean(p.aiEndpoint && p.aiModel);

  function patch(values: Partial<CreationConfig>) {
    setConfig(current => ({ ...current, ...values }));
  }

  const materialDocs = useMemo(() => docs.filter(doc => doc.role === 'material'), [docs]);
  const templateDocs = useMemo(() => docs.filter(doc => doc.role === 'template'), [docs]);
  const subjects = useMemo(() => [...new Set(p.exams.map(exam => exam.subject).filter(Boolean))].sort(), [p.exams]);
  const selectedDocs = materialDocs.filter(doc => config.selectedDocIds.includes(doc.id));

  const passages = useMemo(() => {
    const fromDocs = selectedDocs.flatMap(doc => textParts(doc.text).map(part => ({
      text: part, name: doc.name, topic: topicOf(part, t.unknownTopic || 'Unklar')
    })));
    const fromText = config.sourceText.trim().length >= 35
      ? passagesFromText(config.sourceText, t.wizSourceText, config.topic || t.wizTopic)
      : [];
    if (fromDocs.length || fromText.length || !config.topic.trim()) return [...fromDocs, ...fromText].slice(0, 120);
    return topicOnlyPassages(config.topic, config.lang);
  }, [selectedDocs, config.sourceText, config.topic, config.lang, t.unknownTopic, t.wizSourceText, t.wizTopic]);

  const errors = useMemo(() => validateCreation(config, questions), [config, questions]);
  const templateList = DIDACTIC_TEMPLATES.filter(item => {
    const label = t[item.labelKey] || item.defaultLabel;
    if (templateQuery && !label.toLocaleLowerCase().includes(templateQuery.toLocaleLowerCase())) return false;
    if (templateSubject && item.subject !== 'all' && item.subject !== templateSubject) return false;
    if (templateKind && item.kind !== templateKind) return false;
    if (templateLevel && item.level !== 'all' && item.level !== templateLevel) return false;
    return true;
  });

  function toggleDoc(id: string) {
    patch({ selectedDocIds: config.selectedDocIds.includes(id) ? config.selectedDocIds.filter(value => value !== id) : [...config.selectedDocIds, id] });
  }

  function addObjective() {
    const value = objectiveDraft.trim();
    if (!value || config.objectives.includes(value)) return;
    patch({ objectives: [...config.objectives, value] });
    setObjectiveDraft('');
  }

  function applyTemplate(templateId: string) {
    const template = DIDACTIC_TEMPLATES.find(item => item.id === templateId);
    if (!template) return;
    const blocks = template.formats.map((formatId, index) => ({ ...newBlock(formatId, index), count: index === 0 ? 3 : 2 }));
    patch({ templateId, blocks, autoFormat: false, preferredFormats: [...template.formats] });
  }

  function setFormatPreference(formatId: string) {
    const next = config.preferredFormats.includes(formatId)
      ? config.preferredFormats.filter(value => value !== formatId)
      : [...config.preferredFormats, formatId];
    patch({ preferredFormats: next, autoFormat: false, blocks: next.slice(0, 4).map((id, index) => ({ ...newBlock(id, index), count: 2 })) });
  }

  function updateBlock(id: string, values: Partial<CreationConfig['blocks'][number]>) {
    patch({ blocks: config.blocks.map(block => block.id === id ? { ...block, ...values } : block) });
  }

  function changeBlockFormat(id: string, formatId: string) {
    const format = FORMAT_BY_ID.get(formatId);
    updateBlock(id, {
      formatId,
      operator: format?.operator || 'name',
      requirementLevel: format?.requirementLevel || 'I',
      points: format?.requirementLevel === 'III' ? 6 : format?.requirementLevel === 'II' ? 4 : 3
    });
  }

  function generateDraft() {
    const prepared = config.blocks.length ? config : { ...config, blocks: defaultBlocks(config) };
    if (!config.blocks.length) patch({ blocks: prepared.blocks });
    const built = buildCreation(prepared, passages, t.unknownTopic || 'Unklar');
    if (!built.length) {
      onError(t.wizardErrSource);
      return;
    }
    setQuestions(built);
    setAiQuestions([]);
    setStep(3);
  }

  function updateQuestion(id: string, values: Partial<Q>) {
    setQuestions(current => current.map(question => question.id === id ? { ...question, ...values } : question));
  }

  function changeQuestionFormat(id: string, formatId: string) {
    const format = FORMAT_BY_ID.get(formatId);
    const index = questions.findIndex(question => question.id === id);
    const choice = format?.kind === 'choice'
      ? makeChoiceOptions(passages.length ? passages : topicOnlyPassages(config.topic, config.lang), Math.max(0, index), config.lang)
      : null;
    updateQuestion(id, {
      formatId,
      operator: format?.operator || 'name',
      requirementLevel: format?.requirementLevel || 'I',
      ...(choice ? { options: choice.options, correctIndex: choice.correctIndex, answer: choice.options[choice.correctIndex] } : { options: undefined, correctIndex: undefined })
    });
  }

  function updateOption(questionId: string, optionIndex: number, value: string) {
    setQuestions(current => current.map(question => {
      if (question.id !== questionId) return question;
      const options = [...(question.options || [])];
      options[optionIndex] = value;
      const correctIndex = question.correctIndex;
      return { ...question, options, answer: correctIndex !== undefined ? options[correctIndex] : question.answer };
    }));
  }

  function markCorrect(questionId: string, optionIndex: number) {
    setQuestions(current => current.map(question => {
      if (question.id !== questionId) return question;
      const options = question.options || [];
      return { ...question, correctIndex: optionIndex, answer: options[optionIndex] || question.answer };
    }));
  }

  function addQuestion() {
    const question: Q = {
      id: crypto.randomUUID(), prompt: '', answer: '', source: t.wizSourceText,
      topic: config.topic, points: 1, response: '', formatId: 'open',
      operator: 'name', requirementLevel: 'I', blockId: config.blocks[0]?.id
    };
    setQuestions(current => [...current, question]);
  }

  function buildAiPayload() {
    const payload = {
      task: 'questions',
      level: config.difficulty,
      formats: config.blocks.map(block => block.formatId),
      objectives: config.objectives,
      sources: passages.slice(0, 20).map((passage, index) => ({ index, name: passage.name, topic: passage.topic, text: passage.text }))
    };
    setAiPayload(JSON.stringify(payload));
    setAiPreview(JSON.stringify(payload, null, 2));
    setAiConsent(false);
    onError('');
  }

  async function requestAi() {
    if (!aiConsent) { onError(t.aiConsent); return; }
    if (!passages.length) { onError(t.wizardErrSource); return; }
    setAiBusy(true);
    onError('');
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    try {
      const configForAi = { endpoint: p.aiEndpoint || '', model: p.aiModel || '', shareConsent: aiConsent };
      validateAiConfig(configForAi);
      const result = await requestStructured<AiQuestion[]>(
        configForAi,
        `Create up to 12 grounded exam questions in ${config.lang}. Formats: ${config.blocks.map(block => block.formatId).join(', ') || 'open'}. Objectives: ${config.objectives.join('; ')}. Use only supplied source excerpts.`,
        JSON.parse(aiPayload || '{}'),
        raw => validateQuestions(raw, passages.map(passage => passage.text), 12),
        controller.signal
      );
      const formatId = config.blocks[0]?.formatId || 'open';
      const format = FORMAT_BY_ID.get(formatId);
      const suggestions = result.map((item, index) => {
        const choice = format?.kind === 'choice'
          ? makeChoiceOptions(passages, index, config.lang)
          : null;
        return {
          id: crypto.randomUUID(), prompt: item.prompt, answer: choice ? choice.options[choice.correctIndex] : item.answer,
          source: passages[item.sourceIndex]?.name || t.source, topic: item.topic, points: item.points, response: '',
          formatId, operator: format?.operator || 'name', requirementLevel: format?.requirementLevel || 'I',
          grader: 'ai' as const, feedback: t.aiReview,
          ...(choice ? { options: choice.options, correctIndex: choice.correctIndex } : {})
        } as Q;
      });
      setAiQuestions(suggestions);
      onError('');
    } catch (error) {
      onError(`${t.wizAiError} ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      window.clearTimeout(timeout);
      setAiBusy(false);
    }
  }

  function useAiQuestions() {
    setQuestions(current => [...current, ...aiQuestions]);
    setAiQuestions([]);
    setStep(3);
  }

  function finish(action: WizardAction) {
    if (errors.length) {
      onError(`${t.wizValidation}: ${errors.map(key => t[key] || key).join(' ')}`);
      setStep(3);
      return;
    }
    onCreate(config, questions, action);
  }

  const stepTitles = [t.step1, t.step2, t.step3, t.step4, t.step5];
  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0);
  const groupedBlocks = config.blocks.filter(block => questions.some(question => question.blockId === block.id));

  return <div className="wizard">
    <div className="wizard-head">
      <button className="textbtn" onClick={onCancel}><ArrowLeft size={16} />{t.back}</button>
      <div className="eyebrow"><Sparkles size={14} /> EXAMVISION AI</div>
      <h1>{t.wizardTitle}</h1>
      <p>{t.wizardSubtitle}</p>
    </div>

    <div className="wizard-steps" role="tablist" aria-label={t.wizardTitle}>
      {stepTitles.map((title, index) => <button
        key={title} role="tab" aria-selected={step === index + 1}
        className={`wizstep ${step === index + 1 ? 'active' : ''} ${step > index + 1 ? 'done' : ''}`}
        onClick={() => setStep(index + 1)}
      ><span>{index + 1}</span><b>{title}</b>{step > index + 1 && <Check size={14} />}</button>)}
    </div>

    <div className="wizard-body">
      {step === 1 && <section className="wizpanel">
        <h2>{t.step1}</h2>
        <div className="wiz-grid">
          <label className="wiz-field"><span className="fieldlabel">{t.wizLanguage}</span>
            <select value={config.lang} onChange={event => patch({ lang: event.target.value as CreationConfig['lang'] })}>
              {LANGUAGES.map(([value, label]) => <option value={value} key={value}>{label}</option>)}
            </select>
          </label>
          <label className="wiz-field"><span className="fieldlabel">{t.wizGrade}</span>
            <select value={config.gradeLevel} onChange={event => patch({ gradeLevel: event.target.value })}>
              {GRADES.map(value => <option value={value} key={value}>{t.wizGradeValue} {value}</option>)}
            </select>
          </label>
          <label className="wiz-field"><span className="fieldlabel">{t.wizSubject}</span>
            <input list="wizard-subjects" value={config.subject} placeholder={t.wizSubjectPlaceholder} onChange={event => patch({ subject: event.target.value })} />
            <datalist id="wizard-subjects">{subjects.map(subject => <option value={subject} key={subject} />)}</datalist>
          </label>
          <label className="wiz-field"><span className="fieldlabel">{t.wizTopic}</span>
            <input value={config.topic} placeholder={t.wizTopicPlaceholder} onChange={event => patch({ topic: event.target.value })} />
          </label>
          <label className="wiz-field wide"><span className="fieldlabel">{t.wizTitle}</span>
            <input value={config.title} placeholder={t.wizTitlePlaceholder} onChange={event => patch({ title: event.target.value })} />
          </label>
          <label className="wiz-field wide"><span className="fieldlabel">{t.wizGoal}</span>
            <textarea rows={2} value={config.goal} placeholder={t.wizGoalPlaceholder} onChange={event => patch({ goal: event.target.value })} />
          </label>
        </div>

        <h3>{t.wizSourceMode}</h3>
        <div className="segmented wrap">
          {SOURCE_MODES.map(([value, label]) => <button className={config.sourceMode === value ? 'chosen' : ''} key={value} onClick={() => patch({ sourceMode: value })}>{t[label]}</button>)}
        </div>
        {(config.sourceMode === 'materials' || config.sourceMode === 'mixed') && <div className="wiz-card">
          <p className="muted">{t.wizMaterialsHint}</p>
          {materialDocs.length === 0 ? <div className="inlineempty"><FileText />{t.noMaterial}</div> : <div className="selectdocs">
            {materialDocs.map(doc => <label className="selectdoc" key={doc.id}>
              <input type="checkbox" checked={config.selectedDocIds.includes(doc.id)} onChange={() => toggleDoc(doc.id)} />
              <FileText size={19} /><span><b>{doc.name}</b><small>{textParts(doc.text).length} {t.sourceCount}</small></span>
            </label>)}
          </div>}
          <input ref={materialInput} hidden type="file" accept="application/pdf,image/jpeg,image/png" multiple onChange={event => { onUpload(Array.from(event.target.files || []), 'material'); event.currentTarget.value = ''; }} />
          <button className="btn secondary" onClick={() => materialInput.current?.click()}><Upload size={16} />{t.upload}</button>
        </div>}
        {(config.sourceMode === 'text' || config.sourceMode === 'mixed') && <div className="wiz-card">
          <p className="muted">{t.wizTextHint}</p>
          <textarea rows={5} value={config.sourceText} onChange={event => patch({ sourceText: event.target.value })} placeholder={t.wizGoalPlaceholder} />
        </div>}
        {config.sourceMode === 'topic' && <div className="tip"><Lightbulb size={17} />{t.wizTopicHint}</div>}

        <h3>{t.wizTemplateDoc}</h3>
        <div className="wiz-card">
          <select value={config.templateDocId} onChange={event => patch({ templateDocId: event.target.value })}>
            <option value="">{t.wizNone}</option>
            {templateDocs.map(doc => <option value={doc.id} key={doc.id}>{doc.name}</option>)}
          </select>
          <input ref={templateInput} hidden type="file" accept="application/pdf,image/jpeg,image/png" onChange={event => { onUpload(Array.from(event.target.files || []), 'template'); event.currentTarget.value = ''; }} />
          <button className="btn secondary" onClick={() => templateInput.current?.click()}><Upload size={16} />{t.upload}</button>
        </div>

        <h3>{t.wizDidacticTemplate}</h3>
        <div className="wiz-card wiz-templates">
          <div className="wiz-filters">
            <input value={templateQuery} onChange={event => setTemplateQuery(event.target.value)} placeholder={t.wizTemplateSearch} />
            <select value={templateSubject} onChange={event => setTemplateSubject(event.target.value)}>
              <option value="">{t.wizTemplateAll}</option>
              {[...new Set(DIDACTIC_TEMPLATES.map(item => item.subject))].filter(value => value !== 'all').map(value => <option value={value} key={value}>{value}</option>)}
            </select>
            <select value={templateKind} onChange={event => setTemplateKind(event.target.value)}>
              <option value="">{t.wizTemplateAll}</option>
              <option value="exam">{t.wizTemplateClasswork}</option><option value="practice">{t.wizTemplatePractice}</option><option value="worksheet">{t.wizTemplateWorksheet}</option>
            </select>
            <select value={templateLevel} onChange={event => setTemplateLevel(event.target.value)}>
              <option value="">{t.wizTemplateAll}</option>
              <option value="lower">{t.wizTemplateLevelLower}</option><option value="middle">{t.wizTemplateLevelMiddle}</option><option value="upper">{t.wizTemplateLevelUpper}</option>
            </select>
          </div>
          <div className="wiz-templategrid">
            {templateList.map(item => <button key={item.id} className={`wiz-template ${config.templateId === item.id ? 'chosen' : ''}`} onClick={() => applyTemplate(item.id)}>
              <b>{t[item.labelKey] || item.defaultLabel}</b>
              <small>{item.formats.map(id => formatLabel(id, t)).join(' · ')}</small>
            </button>)}
          </div>
        </div>

        <label className="checkline"><input type="checkbox" checked={config.autoFormat} onChange={event => patch({ autoFormat: event.target.checked })} /><span>{t.wizAutoFormat}</span></label>
        <div className="wiz-formatlist">
          <div className="sectionhead"><h3>{t.wizFormatManual}</h3><small>{TASK_FORMATS.length} {t.wizFormatCount}</small></div>
          <div className="wiz-chips">
            {TASK_FORMATS.map(format => <button key={format.id} className={`wiz-chip ${config.preferredFormats.includes(format.id) ? 'chosen' : ''}`} onClick={() => setFormatPreference(format.id)}>{t[format.labelKey] || format.defaultLabel}</button>)}
          </div>
          {!config.autoFormat && !config.preferredFormats.length && <p className="muted">{inferFormats(config.goal, config.difficulty).map(id => formatLabel(id, t)).join(' · ')}</p>}
        </div>
        {busy && <div className="processing"><span className="spinner" />{p.lang}</div>}
      </section>}

      {step === 2 && <section className="wizpanel">
        <h2>{t.step2}</h2>
        <div className="wiz-card">
          <div className="sectionhead"><h3>{t.wizObjectives}</h3><button className="btn secondary" onClick={() => patch({ objectives: [...new Set([...config.objectives, ...suggestObjectives(passages, config.lang, 4)])] })} disabled={!passages.length}><Sparkles size={15} />{t.wizObjectiveSuggest}</button></div>
          {config.objectives.length === 0 && <p className="muted">{t.wizObjectiveEmpty}</p>}
          {config.objectives.map((objective, index) => <div className="wiz-row" key={`${objective}-${index}`}>
            <input value={objective} onChange={event => patch({ objectives: config.objectives.map((item, position) => position === index ? event.target.value : item) })} />
            <button className="iconbtn danger" title={t.wizRemove} onClick={() => patch({ objectives: config.objectives.filter((_, position) => position !== index) })}><Trash2 size={16} /></button>
          </div>)}
          <div className="wiz-row">
            <input value={objectiveDraft} placeholder={t.wizObjectivePlaceholder} onChange={event => setObjectiveDraft(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); addObjective(); } }} />
            <button className="btn secondary" onClick={addObjective}><Plus size={16} />{t.wizObjectiveAdd}</button>
          </div>
        </div>

        <div className="sectionhead"><h3>{t.wizBlocks}</h3><button className="btn secondary" onClick={() => patch({ blocks: [...config.blocks, newBlock('open', config.blocks.length)] })}><Plus size={16} />{t.wizBlockAdd}</button></div>
        {config.blocks.length === 0 && <p className="muted">{t.wizardErrBlocks}</p>}
        {config.blocks.map((block, index) => <article className="wiz-block" key={block.id}>
          <div className="wiz-blockhead">
            <b>#{index + 1} · {formatLabel(block.formatId, t)}</b>
            <div className="wiz-iconrow">
              <button className="iconbtn" title={t.wizMoveUp} onClick={() => patch({ blocks: reorderBlocks(config.blocks, block.id, -1) })}>↑</button>
              <button className="iconbtn" title={t.wizMoveDown} onClick={() => patch({ blocks: reorderBlocks(config.blocks, block.id, 1) })}>↓</button>
              <button className="iconbtn danger" title={t.wizRemove} onClick={() => patch({ blocks: config.blocks.filter(item => item.id !== block.id) })}><Trash2 size={16} /></button>
            </div>
          </div>
          <div className="wiz-grid">
            <label className="wiz-field"><span className="fieldlabel">{t.wizBlockFormat}</span>
              <select value={block.formatId} onChange={event => changeBlockFormat(block.id, event.target.value)}>
                {TASK_FORMATS.map(format => <option value={format.id} key={format.id}>{t[format.labelKey] || format.defaultLabel}</option>)}
              </select>
            </label>
            <label className="wiz-field"><span className="fieldlabel">{t.wizBlockCount}</span><input type="number" min={1} max={20} value={block.count} onChange={event => updateBlock(block.id, { count: Math.max(1, Math.min(20, Number(event.target.value) || 1)) })} /></label>
            <label className="wiz-field"><span className="fieldlabel">{t.wizBlockPoints}</span><input type="number" min={1} max={30} value={block.points} onChange={event => updateBlock(block.id, { points: Math.max(1, Math.min(30, Number(event.target.value) || 1)) })} /></label>
            <label className="wiz-field"><span className="fieldlabel">{t.wizBlockOperator}</span>
              <select value={block.operator} onChange={event => updateBlock(block.id, { operator: event.target.value })}>
                {OPERATORS.map(operator => <option value={operator.id} key={operator.id}>{t[operator.labelKey] || operator.defaultLabel}</option>)}
              </select>
            </label>
            <label className="wiz-field"><span className="fieldlabel">{t.wizBlockRequirement}</span>
              <select value={block.requirementLevel} onChange={event => updateBlock(block.id, { requirementLevel: event.target.value as 'I' | 'II' | 'III' })}>
                {REQUIREMENT_LEVELS.map(level => <option value={level.id} key={level.id}>{t[level.labelKey] || level.defaultLabel}</option>)}
              </select>
            </label>
            <label className="wiz-field wide"><span className="fieldlabel">{t.wizBlockInstruction}</span><input value={block.instruction} placeholder={t.wizBlockInstructionPlaceholder} onChange={event => updateBlock(block.id, { instruction: event.target.value })} /></label>
          </div>
          {FORMAT_BY_ID.get(block.formatId)?.kind === 'choice' && <div className="tip"><ShieldCheck size={16} />{t.wizMcHint}</div>}
        </article>)}

        <h3>{t.wizExamKind}</h3>
        <div className="segmented wrap">
          {EXAM_KINDS.map(([value, label]) => <button key={value} className={config.examKind === value ? 'chosen' : ''} onClick={() => patch({ examKind: value })}>{t[label]}</button>)}
        </div>
        {config.examKind === 'classwork' && <label className="wiz-field"><span className="fieldlabel">{t.wizDuration}</span><input type="number" min={5} max={180} value={config.duration} onChange={event => patch({ duration: Math.max(5, Math.min(180, Number(event.target.value) || 45)) })} /></label>}

        <h3>{t.wizDifferentiation}</h3>
        <div className="segmented wrap">
          {DIFFERENTIATIONS.map(([value, label]) => <button key={value} className={config.differentiation === value ? 'chosen' : ''} onClick={() => patch({ differentiation: value })}>{t[label]}</button>)}
        </div>
        <div className="wiz-checks">
          <label className="checkline"><input type="checkbox" checked={config.scaffolding} onChange={event => patch({ scaffolding: event.target.checked })} /><span>{t.wizScaffolding}</span></label>
          <label className="checkline"><input type="checkbox" checked={config.partialPoints} onChange={event => patch({ partialPoints: event.target.checked })} /><span>{t.wizPartialPoints}</span></label>
          <label className="checkline"><input type="checkbox" checked={config.showSolutions} onChange={event => patch({ showSolutions: event.target.checked })} /><span>{t.wizShowSolutions}</span></label>
        </div>

        <h3>{t.wizHeader}</h3>
        <div className="wiz-grid three">
          <label className="wiz-field"><span className="fieldlabel">{t.wizHeaderName}</span><input value={config.headerName} onChange={event => patch({ headerName: event.target.value })} /></label>
          <label className="wiz-field"><span className="fieldlabel">{t.wizHeaderClass}</span><input value={config.headerClass} onChange={event => patch({ headerClass: event.target.value })} /></label>
          <label className="wiz-field"><span className="fieldlabel">{t.wizHeaderDate}</span><input value={config.headerDate} onChange={event => patch({ headerDate: event.target.value })} /></label>
        </div>
        <button className="btn primary wide" onClick={generateDraft}><Sparkles size={17} />{t.wizGenerate}</button>
      </section>}

      {step === 3 && <section className="wizpanel">
        <div className="sectionhead"><div><h2>{t.step3}</h2><p className="muted">{t.wizDraftHint}</p></div><button className="btn secondary" onClick={generateDraft}>{t.wizRegenerate}</button></div>
        {errors.length > 0 ? <div className="wiz-error"><b>{t.wizValidation}</b>{errors.map(key => <p key={key}>{t[key] || key}</p>)}</div> : <div className="wiz-ok"><Check size={16} />{t.wizValidationOk}</div>}
        {(config.objectives.length > 0 || passages.length > 0) && <div className="wiz-card">
          <div className="sectionhead"><h3>{t.wizResultObjectives}</h3><small>{passages.length} {t.sourcesAnalyzed}</small></div>
          <p className="muted">{config.objectives.join(' · ') || t.wizObjectiveEmpty}</p>
        </div>}
        {questions.length === 0 && <div className="emptycard"><div className="emptyicon"><FileText /></div><b>{t.wizardErrQuestions}</b><button className="btn primary" onClick={generateDraft}>{t.wizGenerate}</button></div>}
        {groupedBlocks.map(block => <div className="wiz-questiongroup" key={block.id}>
          <h3>{formatLabel(block.formatId, t)} <small>· {operatorLabel(block.operator, t)} · {requirementLabel(block.requirementLevel, t)}</small></h3>
          {questions.map((question, index) => question.blockId !== block.id ? null : <article className="wiz-question" key={question.id}>
            <div className="wiz-questionhead">
              <span className="countpill">{index + 1}</span>
              <small>{formatLabel(question.formatId || block.formatId, t)} · {question.source}</small>
              <div className="wiz-iconrow">
                <button className="iconbtn" title={t.wizMoveUp} onClick={() => setQuestions(current => reorderQuestions(current, question.id, -1))}>↑</button>
                <button className="iconbtn" title={t.wizMoveDown} onClick={() => setQuestions(current => reorderQuestions(current, question.id, 1))}>↓</button>
                <button className="iconbtn danger" title={t.wizRemove} onClick={() => setQuestions(current => current.filter(item => item.id !== question.id))}><Trash2 size={16} /></button>
              </div>
            </div>
            <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionPrompt}</span><textarea rows={2} value={question.prompt} onChange={event => updateQuestion(question.id, { prompt: event.target.value })} /></label>
            <div className="wiz-grid">
              <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionFormat}</span>
                <select value={question.formatId || 'open'} onChange={event => changeQuestionFormat(question.id, event.target.value)}>
                  {TASK_FORMATS.map(format => <option value={format.id} key={format.id}>{t[format.labelKey] || format.defaultLabel}</option>)}
                </select>
              </label>
              <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionPoints}</span><input type="number" min={1} max={30} value={question.points} onChange={event => updateQuestion(question.id, { points: Math.max(1, Number(event.target.value) || 1) })} /></label>
              <label className="wiz-field"><span className="fieldlabel">{t.wizBlockOperator}</span>
                <select value={question.operator || 'name'} onChange={event => updateQuestion(question.id, { operator: event.target.value })}>
                  {OPERATORS.map(operator => <option value={operator.id} key={operator.id}>{t[operator.labelKey] || operator.defaultLabel}</option>)}
                </select>
              </label>
              <label className="wiz-field"><span className="fieldlabel">{t.wizBlockRequirement}</span>
                <select value={question.requirementLevel || 'I'} onChange={event => updateQuestion(question.id, { requirementLevel: event.target.value })}>
                  {REQUIREMENT_LEVELS.map(level => <option value={level.id} key={level.id}>{t[level.labelKey] || level.defaultLabel}</option>)}
                </select>
              </label>
            </div>
            {question.options && <div className="wiz-options">
              <span className="fieldlabel">{t.wizQuestionOptions}</span>
              {question.options.map((option, optionIndex) => <div className="wiz-option" key={optionIndex}>
                <button className={`wiz-radio ${question.correctIndex === optionIndex ? 'chosen' : ''}`} title={t.wizQuestionCorrect} onClick={() => markCorrect(question.id, optionIndex)}>{question.correctIndex === optionIndex ? <Check size={14} /> : 'ABCD'[optionIndex]}</button>
                <input value={option} onChange={event => updateOption(question.id, optionIndex, event.target.value)} />
              </div>)}
            </div>}
            <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionAnswer}</span><textarea rows={2} value={question.answer} onChange={event => updateQuestion(question.id, { answer: event.target.value })} /></label>
          </article>)}
        </div>)}
        {questions.some(question => !groupedBlocks.some(block => block.id === question.blockId)) && <div className="wiz-questiongroup">
          <h3>{t.wizQuestionAdd}</h3>
          {questions.filter(question => !groupedBlocks.some(block => block.id === question.blockId)).map(question => <article className="wiz-question" key={question.id}>
            <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionPrompt}</span><textarea rows={2} value={question.prompt} onChange={event => updateQuestion(question.id, { prompt: event.target.value })} /></label>
            <label className="wiz-field"><span className="fieldlabel">{t.wizQuestionAnswer}</span><textarea rows={2} value={question.answer} onChange={event => updateQuestion(question.id, { answer: event.target.value })} /></label>
            <button className="btn secondary" onClick={() => setQuestions(current => current.filter(item => item.id !== question.id))}><Trash2 size={15} />{t.wizRemove}</button>
          </article>)}
        </div>}
        <button className="btn secondary wide" onClick={addQuestion}><Plus size={17} />{t.wizQuestionAdd}</button>
      </section>}

      {step === 4 && <section className="wizpanel">
        <h2>{t.step4}</h2>
        <div className="wiz-card">
          <div className="sectionhead"><h3><Globe2 size={17} /> {t.wizAiTitle}</h3><span className="countpill">{aiConfigured ? t.aiRemote : t.aiLocal}</span></div>
          <p className="muted">{aiConfigured ? t.wizAiHint : t.wizAiNotConfigured}</p>
          <button className="btn secondary" onClick={buildAiPayload} disabled={!aiConfigured || !passages.length}><Sparkles size={16} />{t.wizAiPreview}</button>
          {aiPreview && <pre className="wiz-pre">{aiPreview}</pre>}
          {aiPreview && <label className="checkline"><input type="checkbox" checked={aiConsent} onChange={event => setAiConsent(event.target.checked)} /><span>{t.wizAiConsent}</span></label>}
          {aiPreview && <div className="btnrow">
            <button className="btn primary" disabled={!aiConsent || aiBusy} onClick={() => void requestAi()}><Sparkles size={16} />{aiBusy ? t.wizAiBusy : t.wizAiRequest}</button>
            <button className="btn secondary" onClick={() => setAiPreview('')}><X size={16} />{t.wizAiCancel}</button>
          </div>}
          {aiQuestions.length > 0 && <div className="wiz-ai-results">
            <b>{aiQuestions.length} {t.wizResultQuestions}</b>
            {aiQuestions.map(question => <p key={question.id}>{question.prompt}</p>)}
            <button className="btn primary" onClick={useAiQuestions}><Check size={16} />{t.wizAiUse}</button>
          </div>}
        </div>
        <div className="tip"><ShieldCheck size={17} />{t.aiOff}</div>
      </section>}

      {step === 5 && <section className="wizpanel">
        <h2>{t.wizResultTitle}</h2>
        {initialExam && <div className="tip"><Lightbulb size={16} />{t.wizModified}</div>}
        <div className="wiz-grid three">
          <div className="stat"><b>{questions.length}</b><small>{t.wizResultQuestions}</small></div>
          <div className="stat"><b>{totalPoints}</b><small>{t.wizResultPoints}</small></div>
          <div className="stat"><b>{config.duration} {t.minutesShort}</b><small>{t.wizDuration}</small></div>
        </div>
        <div className="wiz-card"><h3>{t.wizResultSummary}</h3>
          <p><b>{config.title}</b> · {config.subject} · {t.wizGradeValue} {config.gradeLevel}</p>
          <p className="muted">{config.topic} — {config.goal}</p>
          <p className="muted">{t.wizResultObjectives}: {config.objectives.join(' · ') || '—'}</p>
          <p className="muted">{config.blocks.map(block => `${formatLabel(block.formatId, t)} × ${block.count}`).join(' · ')}</p>
        </div>
        {errors.length > 0 && <div className="wiz-error"><b>{t.wizValidation}</b>{errors.map(key => <p key={key}>{t[key] || key}</p>)}</div>}
        <p className="muted"><ShieldCheck size={15} />{t.wizSavedInfo}</p>
        <div className="wiz-actions">
          <button className="btn secondary" onClick={() => finish('save')}><Check size={16} />{t.wizSaveOnly}</button>
          <button className="btn primary" onClick={() => finish('start')}><ArrowRight size={16} />{t.wizSaveAndStart}</button>
          <button className="btn secondary" onClick={() => finish('student')}><FileText size={16} />{t.wizExportStudent}</button>
          <button className="btn secondary" onClick={() => finish('solution')}><FileText size={16} />{t.wizExportSolutions}</button>
        </div>
      </section>}

      <div className="wizard-nav">
        <button className="btn secondary" disabled={step === 1} onClick={() => setStep(step - 1)}><ArrowLeft size={16} />{t.stepPrev}</button>
        <span className="countpill">{step} / {stepTitles.length}</span>
        {step < stepTitles.length
          ? <button className="btn primary" onClick={() => setStep(step + 1)}>{t.stepNext}<ArrowRight size={16} /></button>
          : <button className="btn primary" onClick={() => finish('save')}><Check size={16} />{t.stepFinish}</button>}
      </div>
    </div>
  </div>;
}

export function configForExam(exam: Exam | null, lang: string): CreationConfig {
  return exam ? configFromExam(exam, lang) : defaultConfig(lang, '');
}

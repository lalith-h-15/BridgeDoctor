import { Download, FileJson, TriangleAlert } from 'lucide-react';
import { useMemo } from 'react';
import { useWorkbench } from '../app/WorkbenchContext';
import { REPORT_WARNING, buildReport, downloadReport, reportFileName } from '../utils/report';
import { Collapsible, EmptyState } from './ui';

export function ExportPanel() {
  const { diagnosis, phase, scenario } = useWorkbench();
  const json = useMemo(() => (diagnosis && phase === 'complete' ? JSON.stringify(buildReport(diagnosis), null, 2) : ''), [diagnosis, phase]);

  if (!diagnosis || phase !== 'complete') {
    return (
      <div data-demo="export">
        <EmptyState icon={<FileJson size={28} strokeWidth={1.5} />} title="Report export unlocks after a diagnosis">
          {phase === 'running' ? 'Waiting for the run to finish.' : `Run scenario ${scenario.id} first. The report is built from its result.`}
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="export" data-demo="export">
      <div className="warn-banner" role="note">
        <TriangleAlert size={18} aria-hidden />
        <strong>{REPORT_WARNING}</strong>
      </div>
      <p>
        The JSON report contains the prototype identifier, scenario, simulated timestamp, diagnosis, confidence category, evidence, triggered rules, recommendations and unverified conditions. It holds no machine details, PINs, keys or documents, and it is generated and downloaded entirely in this browser.
      </p>
      <button type="button" className="btn btn-primary" onClick={() => downloadReport(diagnosis)}>
        <Download size={16} aria-hidden /> Export JSON report
      </button>
      <span className="dim small mono file-name">{reportFileName(diagnosis)}</span>
      <Collapsible title="Preview report contents" className="nested">
        <pre className="json mono" tabIndex={0} aria-label="Report JSON preview">{json}</pre>
      </Collapsible>
    </div>
  );
}

import * as React from 'react';
import { Bullseye, Spinner } from '@patternfly/react-core';
import { PipelineRunLabel } from '../../consts/pipelinerun';
import { useTaskRun } from '../../hooks/usePipelineRunsForApplication';
import { HttpError } from '../../shared/utils/error/http-error';
import { TektonResourceLabel } from '../../types';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { taskRunStatus } from '../../utils/pipeline-utils';
import { useWorkspaceInfo } from '../../utils/workspace-context-utils';
import DetailsPage from '../ApplicationDetails/DetailsPage';
import ErrorEmptyState from '../EmptyState/ErrorEmptyState';
import { SecurityEnterpriseContractTab } from '../EnterpriseContractView/SecurityEnterpriseContractTab';
import { isResourceEnterpriseContract } from '../EnterpriseContractView/utils';
import { StatusIconWithTextLabel } from '../topology/StatusIcon';
import TaskRunDetailsTab from './tabs/TaskRunDetailsTab';
import TaskRunLogsTab from './tabs/TaskRunLogsTab';

type TaskRunDetailsViewProps = {
  taskRunName: string;
};

export const TaskRunDetailsView: React.FC<TaskRunDetailsViewProps> = ({ taskRunName }) => {
  const { namespace, workspace } = useWorkspaceInfo();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();

  const [taskRun, loaded, error] = useTaskRun(namespace, taskRunName);

  const trStatus = React.useMemo(
    () => loaded && taskRun && taskRunStatus(taskRun),
    [loaded, taskRun],
  );

  if (error) {
    const httpError = HttpError.fromCode((error as any).code);
    return (
      <ErrorEmptyState
        httpError={httpError}
        title={`Unable to load task run ${taskRunName}`}
        body={httpError.message}
      />
    );
  }

  if (!loaded) {
    return (
      <Bullseye>
        <Spinner />
      </Bullseye>
    );
  }

  const applicationName = taskRun.metadata?.labels[PipelineRunLabel.APPLICATION];
  const plrName = taskRun.metadata?.labels[TektonResourceLabel.pipelinerun];
  const isEnterpriseContract = isResourceEnterpriseContract(taskRun);

  return (
    <DetailsPage
      headTitle={taskRunName}
      breadcrumbs={[
        ...applicationBreadcrumbs,
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/activity/pipelineruns`,
          name: 'Pipeline runs',
        },
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/pipelineruns/${plrName}`,
          name: plrName,
        },
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/pipelineruns/${plrName}/taskruns`,
          name: `Task runs`,
        },
        {
          path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/taskruns/${taskRunName}`,
          name: taskRunName,
        },
      ]}
      title={
        <>
          <span className="pf-u-mr-sm">{taskRunName}</span>
          <StatusIconWithTextLabel status={trStatus} />
        </>
      }
      baseURL={`/application-pipeline/workspaces/${workspace}/applications/${applicationName}/taskruns/${taskRunName}`}
      tabs={[
        {
          key: 'details',
          label: 'Details',
          component: <TaskRunDetailsTab taskRun={taskRun} error={error} />,
        },
        {
          key: 'logs',
          label: 'Logs',
          component: <TaskRunLogsTab taskRun={taskRun} />,
        },
        ...(isEnterpriseContract
          ? [
              {
                key: 'security',
                label: 'Security',
                component: <SecurityEnterpriseContractTab pipelineRun={plrName} />,
              },
            ]
          : []),
      ]}
    />
  );
};

export default TaskRunDetailsView;

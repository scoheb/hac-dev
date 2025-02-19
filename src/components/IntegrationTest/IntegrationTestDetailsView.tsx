import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Bullseye, Spinner, Text, TextVariants } from '@patternfly/react-core';
import { useIntegrationTestScenario } from '../../hooks/useIntegrationTestScenarios';
import { IntegrationTestScenarioModel } from '../../models';
import { HttpError } from '../../shared/utils/error/http-error';
import { useApplicationBreadcrumbs } from '../../utils/breadcrumb-utils';
import { useAccessReviewForModel } from '../../utils/rbac';
import { useWorkspaceInfo } from '../../utils/workspace-context-utils';
import DetailsPage from '../ApplicationDetails/DetailsPage';
import ErrorEmptyState from '../EmptyState/ErrorEmptyState';
import { useModalLauncher } from '../modal/ModalProvider';
import { integrationTestDeleteModalAndNavigate } from './IntegrationTestsListView/useIntegrationTestActions';
import IntegrationTestOverviewTab from './tabs/IntegrationTestOverviewTab';
import IntegrationTestPipelineRunTab from './tabs/IntegrationTestPipelineRunTab';

type IntegrationTestDetailsViewProps = {
  applicationName: string;
  testName: string;
};

const IntegrationTestDetailsView: React.FC<IntegrationTestDetailsViewProps> = ({
  testName,
  applicationName,
}) => {
  const { namespace, workspace } = useWorkspaceInfo();

  const showModal = useModalLauncher();
  const navigate = useNavigate();
  const applicationBreadcrumbs = useApplicationBreadcrumbs();
  const [canUpdateIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'update',
  );
  const [canDeleteIntegrationTest] = useAccessReviewForModel(
    IntegrationTestScenarioModel,
    'delete',
  );

  const [integrationTest, loaded, loadErr] = useIntegrationTestScenario(
    namespace,
    applicationName,
    testName,
  );

  if (loadErr || (loaded && !integrationTest)) {
    return (
      <ErrorEmptyState
        httpError={HttpError.fromCode(loadErr ? (loadErr as any).code : 404)}
        title="Integration test not found"
        body="No such Integration test"
      />
    );
  }

  if (integrationTest?.metadata) {
    return (
      <DetailsPage
        headTitle={integrationTest.metadata.name}
        breadcrumbs={[
          ...applicationBreadcrumbs,
          {
            path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/integrationtests`,
            name: 'Integration tests',
          },
          {
            path: `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/integrationtests/${testName}`,
            name: integrationTest.metadata.name,
          },
        ]}
        title={
          <Text component={TextVariants.h2}>
            <b data-test="test-name">{integrationTest.metadata.name}</b>
          </Text>
        }
        actions={[
          {
            key: 'edit',
            label: 'Edit',
            component: (
              <Link
                to={`/application-pipeline/workspaces/${workspace}/applications/${applicationName}/integrationtests/${testName}/edit`}
              >
                Edit
              </Link>
            ),
            isDisabled: !canUpdateIntegrationTest,
            disabledTooltip: "You don't have access to edit this integration test",
          },
          {
            onClick: () =>
              showModal<{ submitClicked: boolean }>(
                integrationTestDeleteModalAndNavigate(integrationTest),
              ).closed.then(({ submitClicked }) => {
                if (submitClicked)
                  navigate(
                    `/application-pipeline/workspaces/${workspace}/applications/${applicationName}/integrationtests`,
                  );
              }),
            key: `delete-${integrationTest.metadata.name.toLowerCase()}`,
            label: 'Delete',
            isDisabled: !canDeleteIntegrationTest,
            disabledTooltip: "You don't have access to delete this integration test",
          },
        ]}
        baseURL={`/application-pipeline/workspaces/${workspace}/applications/${applicationName}/integrationtests/${testName}`}
        tabs={[
          {
            key: 'overview',
            label: 'Overview',
            isFilled: true,
            component: <IntegrationTestOverviewTab integrationTest={integrationTest} />,
          },
          {
            key: 'pipelineruns',
            label: 'Pipeline runs',
            component: (
              <IntegrationTestPipelineRunTab
                applicationName={integrationTest.spec.application}
                testName={integrationTest.metadata.name}
              />
            ),
          },
        ]}
      />
    );
  }

  return (
    <Bullseye>
      <Spinner data-test="spinner" />
    </Bullseye>
  );
};

export default IntegrationTestDetailsView;

import type { notificationTypes } from '~/lib/models/notification';
import type { StatusCategory } from '~/lib/models/status';

type LocalNotifiedIssue = {
    orderNumber: number;
    title: string;
    project: {
        identifier: string;
        workspace: { path: string };
    };
};

type LocalNotifiedWorkspaceStatus = {
    color: string;
    category: StatusCategory;
    value: string;
};

export interface LocalUserNotification {
    id: number;
    createdTime: string;
    notification:
        | {
              type: (typeof notificationTypes)['projectCreated'];
              data: {
                  identifier: string;
                  name: string;
                  workspace: { path: string };
              };
          }
        | {
              type: (typeof notificationTypes)['issueCreated'];
              data: LocalNotifiedIssue;
          }
        | {
              type: (typeof notificationTypes)['issueCommentCreated'];
              data: {
                  issue: LocalNotifiedIssue;
              };
          }
        | {
              type: (typeof notificationTypes)['projectMemberInvited'];
              data: {
                  id: number;
                  project: {
                      identifier: string;
                      name: string;
                  };
              };
          }
        | {
              type: (typeof notificationTypes)['workspaceMemberInvited'];
              data: {
                  id: string;
                  workspace: {
                      name: string;
                  };
              };
          }
        | {
              type: (typeof notificationTypes)['issueStatusUpdated'];
              data: {
                  issue: LocalNotifiedIssue;
                  oldStatus?: LocalNotifiedWorkspaceStatus;
                  newStatus?: LocalNotifiedWorkspaceStatus;
              };
          };
}

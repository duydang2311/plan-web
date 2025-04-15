import type { notificationTypes } from '~/lib/models/notification';

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
              data: {
                  orderNumber: number;
                  title: string;
                  project: {
                      identifier: string;
                      workspace: { path: string };
                  };
              };
          }
        | {
              type: (typeof notificationTypes)['issueCommentCreated'];
              data: {
                  issue: {
                      orderNumber: number;
                      title: string;
                      project: {
                          identifier: string;
                          workspace: { path: string };
                      };
                  };
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
          };
}

import type { NotificationType } from '~/lib/models/notification';

export interface LocalUserNotification {
    id: number;
    createdTime: string;
    notification:
        | {
              type: NotificationType['projectCreated'];
              data: {
                  identifier: string;
                  name: string;
                  workspace: { path: string };
              };
          }
        | {
              type: NotificationType['issueCreated'];
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
              type: NotificationType['commentCreated'];
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
              type: NotificationType['projectMemberInvited'];
              data: {
                  id: number;
                  project: {
                      identifier: string;
                      name: string;
                  };
              };
          };
}

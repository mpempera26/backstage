/*
 * Copyright 2020 Spotify AB
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  TextField,
  makeStyles,
  DialogActions,
  Button,
  DialogContent,
  Typography,
  CircularProgress,
} from '@material-ui/core';
import {
  Progress,
  useApi,
  alertApiRef,
  identityApiRef,
  WarningPanel,
} from '@backstage/core';
import { useAsyncFn } from 'react-use';
import { pagerDutyApiRef } from '../../api';
import { Alert, AlertTitle } from '@material-ui/lab';

const useStyles = makeStyles({
  warningText: {
    border: '1px solid rgba(245, 155, 35, 0.5)',
    backgroundColor: 'rgba(245, 155, 35, 0.2)',
    padding: '0.5em 1em',
  },
});

type Props = {
  name: string;
  integrationKey: string;
  onClose: () => void;
};

export const TriggerDialog = ({ name, integrationKey, onClose }: Props) => {
  const classes = useStyles();
  const [description, setDescription] = useState<string>('');
  const alertApi = useApi(alertApiRef);
  const identityApi = useApi(identityApiRef);
  const userId = identityApi.getUserId();
  const api = useApi(pagerDutyApiRef);

  const descriptionChanged = (event: any) => {
    setDescription(event.target.value);
  };

  const [{ value, loading, error }, handleTriggerAlarm] = useAsyncFn(
    async (desc: string) => {
      return await api.triggerAlarm(
        integrationKey,
        window.location.toString(),
        desc,
        userId,
      );
    },
  );

  useEffect(() => {
    if (value) {
      alertApi.post({
        message: `Alarm successfully triggered by ${userId}`,
      });
      onClose();
    }

    if (error) {
      alertApi.post({
        message: `Failed to trigger alarm. ${error.message}`,
        severity: 'error',
      });
    }
  }, [value, error, alertApi, onClose, userId]);

  return (
    <Dialog maxWidth="md" open onClose={onClose} fullWidth>
      <DialogTitle>
        This action will trigger an incident for <strong>"{name}"</strong>.
      </DialogTitle>
      <DialogContent>
        <Alert severity="info">
          {/* <AlertTitle>"Note"</AlertTitle> */}
          <Typography variant="body1" align="justify">
            If the issue you are seeing does not need urgent attention, please
            get in touch with the responsible team using their preferred
            communications channel. You can find information about the owner of
            this entity in the "About" card. If the issue is urgent, please
            don't hesitate to trigger the alert.
          </Typography>
        </Alert>
        <Typography
          variant="body1"
          style={{ marginTop: '1em' }}
          gutterBottom
          align="justify"
        >
          Please describe the problem you want to report. Be as descriptive as
          possible. Your signed in user and a reference to the current page will
          automatically be amended to the alarm so that the receiver can reach
          out to you if necessary.
        </Typography>
        <TextField
          inputProps={{ 'data-testid': 'trigger-input' }}
          id="description"
          multiline
          fullWidth
          rows="4"
          margin="normal"
          label="Problem description"
          variant="outlined"
          onChange={descriptionChanged}
        />
      </DialogContent>
      <DialogActions>
        <Button
          data-testid="trigger-button"
          id="trigger"
          color="secondary"
          disabled={!description || loading}
          variant="contained"
          onClick={() => handleTriggerAlarm(description)}
          endIcon={loading && <CircularProgress size={16} />}
        >
          Trigger Incident
        </Button>
        <Button id="close" color="primary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};
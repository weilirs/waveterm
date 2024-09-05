// Copyright 2024, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { Modal } from "@/app/modals/modal";
import { Markdown } from "@/element/markdown";
import { modalsModel } from "@/store/modalmodel";
import * as keyutil from "@/util/keyutil";
import { UserInputService } from "../store/services";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./userinputmodal.less";

const UserInputModal = (userInputRequest: UserInputRequest) => {
    const [responseText, setResponseText] = useState("");
    const [countdown, setCountdown] = useState(Math.floor(userInputRequest.timeoutms / 1000));
    const checkboxStatus = useRef(false);
    const queryTextAtom = useState;

    const handleSendCancel = useCallback(() => {
        UserInputService.SendUserInputResponse({
            type: "userinputresp",
            requestid: userInputRequest.requestid,
            errormsg: "Canceled by the user",
        });
        modalsModel.popModal();
    }, [responseText, userInputRequest]);

    const handleSendText = useCallback(() => {
        UserInputService.SendUserInputResponse({
            type: "userinputresp",
            requestid: userInputRequest.requestid,
            text: responseText,
            checkboxstat: checkboxStatus.current,
        });
        modalsModel.popModal();
    }, [responseText, userInputRequest]);

    const handleSendConfirm = useCallback(() => {
        UserInputService.SendUserInputResponse({
            type: "userinputresp",
            requestid: userInputRequest.requestid,
            confirm: true,
            checkboxstat: checkboxStatus.current,
        });
        modalsModel.popModal();
    }, [userInputRequest]);

    const handleSubmit = useCallback(() => {
        switch (userInputRequest.responsetype) {
            case "text":
                handleSendText();
                break;
            case "confirm":
                handleSendConfirm();
                break;
        }
    }, [handleSendConfirm, handleSendText, userInputRequest.responsetype]);

    const handleKeyDown = useCallback(
        (waveEvent: WaveKeyboardEvent): boolean => {
            if (keyutil.checkKeyPressed(waveEvent, "Escape")) {
                handleSendCancel();
                return;
            }
            if (keyutil.checkKeyPressed(waveEvent, "Enter")) {
                handleSubmit();
                return true;
            }
        },
        [handleSendCancel, handleSubmit]
    );

    const queryText = useMemo(() => {
        if (userInputRequest.markdown) {
            return <Markdown text={userInputRequest.querytext} className="userinput-markdown" />;
        }
        return <span className="userinput-text">{userInputRequest.querytext}</span>;
    }, [userInputRequest.markdown, userInputRequest.querytext]);

    const inputBox = useMemo(() => {
        if (userInputRequest.responsetype === "confirm") {
            return <></>;
        }
        return (
            <input
                type={userInputRequest.publictext ? "text" : "password"}
                onChange={(e) => setResponseText(e.target.value)}
                value={responseText}
                maxLength={400}
                className="userinput-inputbox"
                autoFocus={true}
                onKeyDown={(e) => keyutil.keydownWrapper(handleKeyDown)(e)}
            />
        );
    }, [userInputRequest.responsetype, userInputRequest.publictext, responseText, handleKeyDown, setResponseText]);

    useEffect(() => {
        let timeout: ReturnType<typeof setTimeout>;
        if (countdown == 0) {
            timeout = setTimeout(() => {
                handleSendCancel();
            }, 300);
        } else {
            timeout = setTimeout(() => {
                setCountdown(countdown - 1);
            }, 1000);
        }
        return () => clearTimeout(timeout);
    }, [countdown]);

    return (
        <Modal onOk={() => handleSubmit()} onCancel={() => handleSendCancel()}>
            <div className="userinput-body">
                {userInputRequest.title + ` (${countdown}s)`}
                {queryText}
                {inputBox}
            </div>
        </Modal>
    );
};

UserInputModal.displayName = "UserInputModal";

export { UserInputModal };

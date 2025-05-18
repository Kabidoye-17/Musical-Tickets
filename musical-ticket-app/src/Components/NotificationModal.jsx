import styled from 'styled-components';
import { DetailsBoxValue } from './DetailsBox';
import { X } from "@phosphor-icons/react";

const Background = styled.div`
    position: fixed; /* Fix to viewport */
    top: 0;
    left: 0;
    height: 100vh;
    width: 100vw;
    background-color: rgba(228, 192, 217, 0.5);
    z-index: 999;
    display: flex;
    justify-content: center;
    align-items: center;
`;

const ModalContainer = styled.div`  
    display: flex;
    flex-direction: column;
    width: 600px;
    border-radius: 8px;
    overflow: hidden; /* Ensures child elements respect border radius */
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const ModalHeader = styled.div`
    display: flex;
    height: 40px;
    align-items: center;
    justify-content: end;
    background-color: white;
    width: 100%;
    padding-top: 30px;
`;

const ModalBody = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: start;
    align-items: center;
    background-color: white;
    padding: 20px;
    height: 200px;
`;


const NotificationHeader = styled.div`
    font-size: 3rem;  
    font-weight: bold;  
    color: ${props => props.success ? '#4CAF50' : '#FF0000'};
    margin: 0;
    padding-bottom: 15px;
`;

const CloseButton = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 30px;
    color: #ff9c59;
    &:hover {
        color: #ff7f40;
    }
`;

function NotificationModal(props){
    return(
        <Background>
            <ModalContainer>
                <ModalHeader>
                    <CloseButton onClick={props.closeModal}>
                        <X size={32} weight="bold" />   
                    </CloseButton>
                </ModalHeader>
                <ModalBody>
                    <NotificationHeader success={props.message.success}>
                        {props.message.success ? "Yay" : "Uh Oh"}
                    </NotificationHeader>
                    <DetailsBoxValue>{props.message.message}</DetailsBoxValue>
                </ModalBody>
            </ModalContainer>
        </Background>
    );
}

export default NotificationModal;
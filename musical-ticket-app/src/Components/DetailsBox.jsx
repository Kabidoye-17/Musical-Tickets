import styled from 'styled-components';
import { Copy, ThumbsUp } from "@phosphor-icons/react";
import React, { useState } from 'react';

const DetailsBoxContainer = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    justify-content: center;
    align-items: center;
    height: 400px;
    width: 40%;
    margin-top: 10px;
    background-color: white;
    padding: 40px;
    text-align: center;
    border-radius: 25px;
    box-shadow: rgba(50, 50, 93, 0.25) 0px 13px 27px -5px, rgba(0, 0, 0, 0.3) 0px 8px 16px -8px;
    `;

export const DetailsBoxTitle = styled.h2`
    font-size: 2rem;
    color: #ff9c59;
    margin: 0;
    `;  

export const DetailsBoxValue = styled.p`   
    font-size: 1.5rem;
    color: grey;
    margin: 0;
    text-align: center;
    display: -webkit-box;
    -webkit-line-clamp: 6; 
    -webkit-box-orient: vertical;
    overflow: hidden;
    overflow-wrap: break-word;
    text-overflow: ellipsis;
    max-width: 100%;
    max-height: 300px; 
    padding: 0 20px;
`;

const Button = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.5rem;
    padding: 30px;
    color:rgb(172, 171, 170);
    &:hover {
        color:rgb(73, 73, 73);
    }

`;

function DetailsBox(props) {
    const [showSuccess, setShowSuccess] = useState(false);
    const copyText = () => {
        navigator.clipboard.writeText(props.value);
        setShowSuccess(true);
        setTimeout(() => {
            setShowSuccess(false);
        }, 500);
    }

    return (
    <>
    <DetailsBoxContainer>
        <DetailsBoxTitle>{props.title}</DetailsBoxTitle>
        <DetailsBoxValue>{props.value}</DetailsBoxValue>
        {!showSuccess && <Button onClick={() => copyText()}><Copy size={32}></Copy></Button>}
        {showSuccess &&<Button><ThumbsUp size={32} color='green'></ThumbsUp></Button> }
    </DetailsBoxContainer>
    </>
    );
  }
  
export default DetailsBox;
import styled from 'styled-components';

const StyledWarningBox = styled.div`
  background-color: #fff3cd;
  color: #856404;
  border: 1px solid #ffeeba;
  border-radius: 8px;
  padding: 15px;
  margin: 20px 0;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  font-size: 14px;
`;

const StyledWarningIcon = styled.span`
  font-size: 20px;
  margin-right: 10px;
`;

const WarningBox = ({ icon = "⚠️", children }) => {
  return (
    <StyledWarningBox>
      <StyledWarningIcon>{icon}</StyledWarningIcon>
      <div>{children}</div>
    </StyledWarningBox>
  );
};

export default WarningBox;

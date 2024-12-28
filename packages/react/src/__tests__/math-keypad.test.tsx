/**
 * @jest-environment jsdom
 */
import * as React from 'react';
import userEvent from '@testing-library/user-event';
import { render, screen } from '@testing-library/react';

import MathKeypad from '../math-keypad';

import type { EditingEvent } from '../math-keypad';

type Props = {
  readonly editMock: (event: EditingEvent) => unknown;
};

const TestComp = (props: Props) => {
  const { editMock } = props;
  const handleEditing = React.useCallback(
    (e: CustomEvent): void => {
      const { detail } = e;
      editMock(detail);
    },
    [editMock],
  ) as EventListener;

  React.useEffect(
    () => {
      // Add event listener
      window.addEventListener('editing', handleEditing);

      // Remove event listener on cleanup
      return () => {
        window.removeEventListener('editing', handleEditing);
      };
    },
    [handleEditing], // Re-run if the handler changes
  );

  return (
    <div>
      <MathKeypad />
      <input type="text" />
    </div>
  );
};

describe('MathKeypad', () => {
  test("it should trigger a 'keydown' event", async () => {
    const mockKeyDown = jest.fn();

    render(
      <div>
        <MathKeypad />
        <input type="text" onKeyDown={mockKeyDown} />
      </div>,
    );

    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('\u221A'));

    expect(mockKeyDown).toHaveBeenCalled();
  });

  test("'+ bmatrix' should trigger 'InsertMatrix' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ bmatrix'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'InsertMatrix',
      delimiters: 'brackets',
    });
  });

  test("'+ pmatrix' should trigger 'InsertMatrix' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ pmatrix'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'InsertMatrix',
      delimiters: 'parens',
    });
  });

  // TODO: create a separate button component so that we only have to test
  // the focus behavior once.
  test("clicking '+ bmatrix' doesn't unfocus input", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ bmatrix'));

    // Assert
    expect(screen.getByRole('textbox')).toHaveFocus();
  });

  test("'+ row above' should trigger 'AddRow' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ row above'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({ type: 'AddRow', side: 'above' });
  });

  test("'+ row below' should trigger 'AddRow' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ row below'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({ type: 'AddRow', side: 'below' });
  });

  test("'+ col left' should trigger 'AddColumn' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ col left'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'AddColumn',
      side: 'left',
    });
  });

  test("'+ col right' should trigger 'AddColumn' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('+ col right'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'AddColumn',
      side: 'right',
    });
  });

  test("'- row' should trigger 'DeleteRow' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('- row'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'DeleteRow',
    });
  });

  test("'- col' should trigger 'DeleteColumn' editing event", async () => {
    // Arrange
    const editMock = jest.fn();
    render(<TestComp editMock={editMock} />);

    // Act
    screen.getByRole('textbox').focus();
    await userEvent.click(screen.getByText('- col'));

    // Assert
    expect(editMock).toHaveBeenCalledWith({
      type: 'DeleteColumn',
    });
  });
});

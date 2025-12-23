import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MessageIndicatorComponent } from './message-indicator.component';
import { Birthday, ScheduledMessage } from '../../models';

describe('MessageIndicatorComponent', () => {
  let component: MessageIndicatorComponent;
  let fixture: ComponentFixture<MessageIndicatorComponent>;

  const createMockMessage = (id: string, title: string, time: string, active: boolean): ScheduledMessage => ({
    id,
    birthdayId: '1',
    title,
    message: 'Test message',
    scheduledTime: time,
    priority: 'normal',
    active,
    messageType: 'text',
    createdDate: new Date()
  });

  const createMockBirthday = (messages?: ScheduledMessage[]): Birthday => ({
    id: '1',
    name: 'John Doe',
    birthDate: new Date(1990, 0, 15),
    category: 'Family',
    scheduledMessages: messages
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MessageIndicatorComponent, NoopAnimationsModule]
    }).compileComponents();

    fixture = TestBed.createComponent(MessageIndicatorComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('hasActiveMessages', () => {
    it('should return false when birthday is null', () => {
      component.birthday = null;
      expect(component.hasActiveMessages).toBeFalse();
    });

    it('should return false when birthday has no scheduledMessages', () => {
      component.birthday = createMockBirthday();
      expect(component.hasActiveMessages).toBeFalse();
    });

    it('should return false when birthday has empty scheduledMessages array', () => {
      component.birthday = createMockBirthday([]);
      expect(component.hasActiveMessages).toBeFalse();
    });

    it('should return false when all messages are inactive', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', false),
        createMockMessage('2', 'Msg2', '12:00', false)
      ]);
      expect(component.hasActiveMessages).toBeFalse();
    });

    it('should return true when at least one message is active', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', false)
      ]);
      expect(component.hasActiveMessages).toBeTrue();
    });
  });

  describe('activeMessageCount', () => {
    it('should return 0 when birthday is null', () => {
      component.birthday = null;
      expect(component.activeMessageCount).toBe(0);
    });

    it('should return 0 when birthday has no scheduledMessages', () => {
      component.birthday = createMockBirthday();
      expect(component.activeMessageCount).toBe(0);
    });

    it('should return 0 when no messages are active', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', false),
        createMockMessage('2', 'Msg2', '12:00', false)
      ]);
      expect(component.activeMessageCount).toBe(0);
    });

    it('should return correct count of active messages', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', false),
        createMockMessage('3', 'Msg3', '18:00', true)
      ]);
      expect(component.activeMessageCount).toBe(2);
    });

    it('should return total count when all messages are active', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', true)
      ]);
      expect(component.activeMessageCount).toBe(2);
    });
  });

  describe('totalMessageCount', () => {
    it('should return 0 when birthday is null', () => {
      component.birthday = null;
      expect(component.totalMessageCount).toBe(0);
    });

    it('should return 0 when birthday has no scheduledMessages', () => {
      component.birthday = createMockBirthday();
      expect(component.totalMessageCount).toBe(0);
    });

    it('should return 0 when scheduledMessages is empty array', () => {
      component.birthday = createMockBirthday([]);
      expect(component.totalMessageCount).toBe(0);
    });

    it('should return correct total count', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', false),
        createMockMessage('3', 'Msg3', '18:00', true)
      ]);
      expect(component.totalMessageCount).toBe(3);
    });
  });

  describe('tooltipText', () => {
    it('should show "No information available" when birthday is null', () => {
      component.birthday = null;
      component.ngOnChanges({
        birthday: {
          currentValue: null,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toBe('No information available');
    });

    it('should show "No messages configured" when no messages exist', () => {
      component.birthday = createMockBirthday([]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toContain('No messages configured');
    });

    it('should show "messages configured but disabled" when all messages are inactive', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', false),
        createMockMessage('2', 'Msg2', '12:00', false)
      ]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toContain('2 messages configured but disabled');
    });

    it('should show singular "message" when one inactive message exists', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', false)
      ]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toContain('1 message configured but disabled');
    });

    it('should show detailed info for single active message', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Birthday Reminder', '09:00', true)
      ]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toContain('Message configured: "Birthday Reminder"');
      expect(component.tooltipText).toContain('sending at 09:00');
    });

    it('should show count when all messages are active', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', true),
        createMockMessage('3', 'Msg3', '18:00', true)
      ]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toBe('✅ 3 messages configured and active for birthday');
    });

    it('should show partial count when some messages are active', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', true),
        createMockMessage('2', 'Msg2', '12:00', false),
        createMockMessage('3', 'Msg3', '18:00', true)
      ]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });

      expect(component.tooltipText).toBe('✅ 2 of 3 configured messages are active');
    });
  });

  describe('getNextMessageInfo', () => {
    it('should return empty string when no active messages', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '09:00', false)
      ]);
      expect(component.getNextMessageInfo()).toBe('');
    });

    it('should return empty string when birthday is null', () => {
      component.birthday = null;
      expect(component.getNextMessageInfo()).toBe('');
    });

    it('should return next message info for single active message', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Morning Reminder', '09:00', true)
      ]);
      const result = component.getNextMessageInfo();

      expect(result).toBe('Next: Morning Reminder at 09:00');
    });

    it('should return earliest message when multiple active messages exist', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Evening', '18:00', true),
        createMockMessage('2', 'Morning', '09:00', true),
        createMockMessage('3', 'Afternoon', '12:00', true)
      ]);
      const result = component.getNextMessageInfo();

      expect(result).toBe('Next: Morning at 09:00');
    });

    it('should ignore inactive messages when finding next', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Early Inactive', '06:00', false),
        createMockMessage('2', 'Morning Active', '09:00', true),
        createMockMessage('3', 'Late Inactive', '20:00', false)
      ]);
      const result = component.getNextMessageInfo();

      expect(result).toBe('Next: Morning Active at 09:00');
    });

    it('should sort by time string correctly', () => {
      component.birthday = createMockBirthday([
        createMockMessage('1', 'Msg1', '23:00', true),
        createMockMessage('2', 'Msg2', '01:00', true),
        createMockMessage('3', 'Msg3', '12:00', true)
      ]);
      const result = component.getNextMessageInfo();

      expect(result).toBe('Next: Msg2 at 01:00');
    });
  });

  describe('ngOnChanges', () => {
    it('should update tooltip when birthday changes', () => {
      const initialBirthday = createMockBirthday([]);
      const updatedBirthday = createMockBirthday([
        createMockMessage('1', 'Test', '09:00', true)
      ]);

      component.birthday = initialBirthday;
      component.ngOnChanges({
        birthday: {
          currentValue: initialBirthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      const initialTooltip = component.tooltipText;

      component.birthday = updatedBirthday;
      component.ngOnChanges({
        birthday: {
          currentValue: updatedBirthday,
          previousValue: initialBirthday,
          firstChange: false,
          isFirstChange: () => false
        }
      });

      expect(component.tooltipText).not.toBe(initialTooltip);
    });

    it('should not update tooltip when other properties change', () => {
      component.birthday = createMockBirthday([]);
      component.ngOnChanges({
        birthday: {
          currentValue: component.birthday,
          previousValue: null,
          firstChange: true,
          isFirstChange: () => true
        }
      });
      const initialTooltip = component.tooltipText;

      component.ngOnChanges({});

      expect(component.tooltipText).toBe(initialTooltip);
    });
  });
});

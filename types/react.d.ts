import 'react';

import * as React from 'react';

declare module 'react' {
  interface InputHTMLAttributes<T> extends React.HTMLAttributes<T> {
    capture?: boolean | "user" | "environment" | "camera" | undefined;
  }
}